import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Xavfsiz joydan kalitni olamiz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { prompt, userLocation } = await req.json();

    // 2026-yilgi eng yangi va mos keluvchi modelni tanlaymiz
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // AI ga aniq buyruq (System Prompt) beramiz
    const systemInstruction = `Sen 'Epchil' platformasining aqlli agentisan. 
    Mijozning matnini tahlil qilib, faqat qat'iy JSON formatda javob qaytar. Hech qanday ortiqcha gap yozma.
    Format: { "kasb": "santexnik|elektrik|kafelchi|romchi|tozalovchi", "hudud": "tuman yoki shahar nomi", "holat": "shoshilinch|odatiy", "tavsif": "muammoning qisqacha izohi" }
    Agar mijoz matnida manzilni yozmagan bo'lsa, uning avtomatik aniqlangan manzili: '${userLocation || "noma'lum"}' ekanligini qabul qil va "hudud" ga yoz. Agar matnida alohida manzil aytilgan bo'lsa, o'sha aytgan manzilni ol.`;

    const result = await model.generateContent(`${systemInstruction}\n\nMijoz matni: ${prompt}`);
    const response = await result.response;
    let text = response.text();

    // AI qaytargan javobdan faqat JSON qismini tozalab olamiz
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI bilan bog'lanishda xatolik:", error);
    return NextResponse.json({ error: "Tizimda xatolik yuz berdi" }, { status: 500 });
  }
}