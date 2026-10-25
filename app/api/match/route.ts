import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Tried in order. A busy/unavailable model (503, 429, timeout) moves to the next one.
const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const PER_MODEL_TIMEOUT_MS = 8000;
const MAX_PROMPT_CHARS = 600;

type Match = { kasb: string; hudud: string; holat: string; tavsif: string };
// tested
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  santexnik: ["quvur", "kran", "suv", "sifon", "truba", "unitaz", "dush", "vanna", "santexnik", "труб", "кран", "вод", "сантех", "pipe", "tap", "faucet", "plumb", "leak"],
  elektrik: ["rozetka", "sim", "tok", "chiroq", "svet", "elektrik", "lyustra", "avtomat", "электр", "розетк", "провод", "свет", "люстр", "socket", "wire", "electric", "light"],
  kafelchi: ["kafel", "plitka", "mramor", "keramika", "плитк", "кафел", "tile"],
  romchi: ["rom", "deraza", "akfa", "plastik", "chivin", "oyna", "окн", "окон", "пластик", "window"],
  tozalovchi: ["tozalash", "yuvish", "uborka", "pilesos", "chang", "уборк", "чистк", "мыт", "clean", "wash", "dust"],
  konditsioner: ["konditsioner", "kondicioner", "кондиционер", "air condition", "ac unit"],
  duradgor: ["duradgor", "mebel", "eshik", "плотник", "мебел", "двер", "carpent", "furniture", "door"],
};

const URGENT_WORDS = ["shoshilinch", "tez", "yorilib", "oqyapti", "oqmoqda", "срочно", "прорв", "течёт", "течет", "urgent", "burst", "flood", "emergency", "asap"];

/** Cheap keyword classifier used when every AI model is unavailable. */
function fallbackMatch(prompt: string, userLocation?: string): Match {
  const q = prompt.toLowerCase();
  let kasb = "";
  let best = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = words.filter((w) => q.includes(w)).length;
    if (hits > best) {
      best = hits;
      kasb = cat;
    }
  }
  const urgent = URGENT_WORDS.some((w) => q.includes(w));
  return {
    kasb,
    hudud: userLocation && userLocation !== "null" ? userLocation : "noma'lum",
    holat: urgent ? "shoshilinch" : "odatiy",
    tavsif: prompt.slice(0, 140),
  };
}

function extractJson(text: string): Match {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  const data = JSON.parse(cleaned.slice(start, end + 1));
  return {
    kasb: String(data.kasb ?? ""),
    hudud: String(data.hudud ?? ""),
    holat: String(data.holat ?? "odatiy"),
    tavsif: String(data.tavsif ?? ""),
  };
}

// Naive per-IP limiter (per server instance): protects the Gemini quota from abuse.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_MAX;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests, please wait a minute." }, { status: 429 });
  }

  let prompt = "";
  let userLocation = "";
  try {
    const body = await req.json();
    prompt = String(body.prompt ?? "").slice(0, MAX_PROMPT_CHARS).trim();
    // The location is interpolated into the prompt: keep it short and free of quotes/newlines.
    userLocation = String(body.userLocation ?? "").replace(/["'`\n\r]/g, " ").slice(0, 80).trim();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: "Empty prompt" }, { status: 400 });

  const systemInstruction = `Sen 'Epchil' platformasining aqlli agentisan.
Mijozning matnini tahlil qilib, faqat qat'iy JSON formatda javob qaytar. Hech qanday ortiqcha gap yozma.
Format: { "kasb": "santexnik|elektrik|kafelchi|romchi|tozalovchi|konditsioner|duradgor", "hudud": "tuman yoki shahar nomi", "holat": "shoshilinch|odatiy", "tavsif": "muammoning qisqacha izohi" }
Agar mijoz matnida manzilni yozmagan bo'lsa, uning avtomatik aniqlangan manzili: '${userLocation || "noma'lum"}' ekanligini qabul qil va "hudud" ga yoz. Agar matnida alohida manzil aytilgan bo'lsa, o'sha aytgan manzilni ol.`;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { timeout: PER_MODEL_TIMEOUT_MS });
      const result = await model.generateContent(`${systemInstruction}\n\nMijoz matni: ${prompt}`);
      return NextResponse.json(extractJson(result.response.text()));
    } catch (error) {
      console.warn(`AI model ${modelName} failed:`, (error as Error)?.message?.slice(0, 160));
    }
  }

  // Every model failed: keep the product usable with a keyword classifier.
  return NextResponse.json({ ...fallbackMatch(prompt, userLocation), fallback: true });
}
