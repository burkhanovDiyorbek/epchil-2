import {
  collection, doc, getDocs, query, Timestamp, where, writeBatch, type WriteBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Demo data for the admin dashboard / pitch. Everything carries `isDemo: true`,
 * lives under ids starting with "demo_" and can be wiped with clearDemoData().
 * Writing it requires an admin account (see firestore.rules). No Auth accounts are created.
 */

const MASTER_NAMES = [
  ["Jahongir", "Rahimov"], ["Sardor", "Alimov"], ["Bekzod", "Karimov"], ["Diyorbek", "Burxonov"], ["Otabek", "Yusupov"],
  ["Shoxrux", "Tursunov"], ["Akmal", "Nazarov"], ["Farhod", "Mirzayev"], ["Ulug'bek", "Qodirov"], ["Javlon", "Hamidov"],
  ["Nodir", "Saidov"], ["Rustam", "Ismoilov"], ["Aziz", "Bobomurodov"], ["Sherzod", "Ergashev"], ["Malika", "Rustamova"],
  ["Dilshod", "Xolmatov"], ["Anvar", "Jo'rayev"], ["Eldor", "Omonov"],
];
const CUSTOMER_NAMES = [
  ["Madina", "Aliyeva"], ["Gulnora", "Karimova"], ["Aziza", "Sobirova"], ["Laylo", "Ahmedova"], ["Nigora", "Qosimova"],
  ["Sevara", "Rahmonova"], ["Zilola", "Yo'ldosheva"], ["Dilnoza", "Hasanova"], ["Kamola", "Ergasheva"], ["Feruza", "Tojiboyeva"],
  ["Bobur", "Toshmatov"], ["Hasan", "Normatov"], ["Umid", "Safarov"], ["Temur", "Abdullayev"], ["Sanjar", "Qurbonov"],
  ["Ilhom", "Mamatqulov"], ["Zafar", "Raxmatov"], ["Behzod", "Odilov"], ["Nilufar", "Sattorova"], ["Shahlo", "Ibragimova"],
];

const CATEGORIES: { key: string; services: string[]; price: [number, number] }[] = [
  { key: "santexnik", services: ["Quvur ta'miri", "Kran o'rnatish", "Suv isitgich"], price: [70000, 110000] },
  { key: "elektrik", services: ["Rozetka o'rnatish", "Sim tortish", "Lyustra osish"], price: [80000, 120000] },
  { key: "kafelchi", services: ["Kafel yotqizish", "Hammom kafeli"], price: [110000, 160000] },
  { key: "romchi", services: ["Plastik romlar", "Deraza sozlash"], price: [90000, 130000] },
  { key: "tozalovchi", services: ["Kvartira tozalash", "Bosh tozalash"], price: [60000, 90000] },
  { key: "konditsioner", services: ["O'rnatish", "Tozalash", "Freon to'ldirish"], price: [90000, 140000] },
  { key: "duradgor", services: ["Mebel ta'miri", "Eshik o'rnatish"], price: [80000, 130000] },
];

const PLACES: { region: string; districts: string[]; lat: number; lng: number }[] = [
  { region: "Samarqand", districts: ["Samarqand shahri", "Urgut", "Kattaqo'rg'on", "Jomboy"], lat: 39.6542, lng: 66.9597 },
  { region: "Qashqadaryo", districts: ["Qarshi shahri", "Shahrisabz", "Kitob", "Koson"], lat: 38.8606, lng: 65.7891 },
  { region: "Toshkent shahri", districts: ["Chilonzor", "Yunusobod", "Mirobod"], lat: 41.2995, lng: 69.2401 },
  { region: "Buxoro", districts: ["Buxoro shahri"], lat: 39.7681, lng: 64.4556 },
];

const PROBLEMS = [
  "Kran yorilib ketdi, suv oqyapti", "Rozetkada uchqun chiqyapti", "Hammomga kafel yotqizish kerak", "Konditsioner sovuq bermayapti",
  "Deraza yopilmayapti", "Kvartirani bosh tozalash", "Unitaz tiqilib qoldi", "Lyustra osib berish", "Eshik qulfi buzilgan",
  "Isitgich suv oqizyapti", "Avtomat tez-tez o'chib qolyapti", "Mebel yig'ib berish",
];

const COMMENTS = [
  "Tez keldi va sifatli bajardi, rahmat!", "Juda mas'uliyatli usta, tavsiya qilaman.", "Narxi adolatli, ish toza.",
  "Vaqtida keldi, hammasini tushuntirib berdi.", "Yaxshi, lekin biroz kechikdi.", "Muammo bir marta bilan hal bo'ldi.",
  "Professional yondashuv, minnatdorman.", "Ish sifati yaxshi, qayta murojaat qilaman.",
];

// Deterministic pseudo-random so a re-seed gives the same data shape.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pick = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];
const daysAgo = (d: number, r: () => number) => Timestamp.fromMillis(Date.now() - d * 86_400_000 - Math.floor(r() * 43_200_000));

class Batcher {
  private batch: WriteBatch = writeBatch(db);
  private n = 0;
  total = 0;
  async set(ref: ReturnType<typeof doc>, data: Record<string, unknown>) {
    this.batch.set(ref, data);
    this.bump();
  }
  async del(ref: ReturnType<typeof doc>) {
    this.batch.delete(ref);
    this.bump();
  }
  private pending: Promise<void>[] = [];
  private bump() {
    this.n++;
    this.total++;
    if (this.n >= 400) this.flush();
  }
  private flush() {
    this.pending.push(this.batch.commit());
    this.batch = writeBatch(db);
    this.n = 0;
  }
  async done() {
    if (this.n > 0) this.flush();
    await Promise.all(this.pending);
  }
}

export interface DemoDoc {
  col: string;
  id: string;
  data: Record<string, unknown>;
}
const ref = (col: string, id: string) => ({ col, id });
class Collector {
  docs: DemoDoc[] = [];
  set(r: { col: string; id: string }, data: Record<string, unknown>) {
    this.docs.push({ col: r.col, id: r.id, data });
  }
}

export interface SeedSummary {
  masters: number;
  customers: number;
  orders: number;
  reviews: number;
}

export function buildDemoDocs(): { docs: DemoDoc[]; summary: SeedSummary } {
  const r = rng(20260101);
  const sink = new Collector();
  const summary: SeedSummary = { masters: 0, customers: 0, orders: 0, reviews: 0 };

  // Masters (users + masters docs)
  const masters = MASTER_NAMES.map(([first, last], i) => {
    const cat = CATEGORIES[i % CATEGORIES.length];
    // Mostly the two pilot regions (Samarkand, Kashkadarya), a few elsewhere.
    const place = PLACES[[0, 0, 1, 1, 2, 3][i % 6]];
    const price = Math.round((cat.price[0] + r() * (cat.price[1] - cat.price[0])) / 5000) * 5000;
    return {
      id: `demo_m_${i + 1}`,
      first,
      last,
      cat,
      place,
      district: pick(place.districts, r),
      price,
      verified: r() > 0.45,
      createdAt: daysAgo(Math.floor(r() * 55) + 5, r),
      phone: `+998 (9${Math.floor(r() * 10)}) ${100 + Math.floor(r() * 899)}-${10 + Math.floor(r() * 89)}-${10 + Math.floor(r() * 89)}`,
    };
  });

  for (const m of masters) {
    const common = {
      name: `${m.first} ${m.last}`,
      phone: m.phone,
      email: `${m.first.toLowerCase().replace(/[^a-z]/g, "")}.${m.id}@demo.epchil.uz`,
      category: m.cat.key,
      services: m.cat.services,
      basePrice: m.price,
      region: m.place.region,
      district: m.district,
      bio: "Demo usta: tajribali mutaxassis.",
      isDemo: true,
      createdAt: m.createdAt,
    };
    sink.set(ref("users", m.id), { uid: m.id, role: "master", ...common });
    sink.set(ref("masters", m.id), {
      ...common,
      firstName: m.first,
      lastName: m.last,
      isVerified: m.verified,
      isAvailable: r() > 0.15,
      isHidden: false,
    });
    summary.masters++;
  }

  // Customers
  const customers = CUSTOMER_NAMES.map(([first, last], i) => {
    const place = PLACES[i % 3 === 2 ? 2 : i % 3];
    return {
      id: `demo_c_${i + 1}`,
      name: `${first} ${last}`,
      place,
      district: pick(place.districts, r),
      createdAt: daysAgo(Math.floor(r() * 50), r),
      phone: `+998 (9${Math.floor(r() * 10)}) ${100 + Math.floor(r() * 899)}-${10 + Math.floor(r() * 89)}-${10 + Math.floor(r() * 89)}`,
    };
  });
  for (const c of customers) {
    sink.set(ref("users", c.id), {
      uid: c.id,
      role: "customer",
      name: c.name,
      phone: c.phone,
      email: `${c.id}@demo.epchil.uz`,
      region: c.place.region,
      district: c.district,
      isDemo: true,
      createdAt: c.createdAt,
    });
    summary.customers++;
  }

  // Orders + reviews over the last ~45 days (more recent = more orders, i.e. growth)
  const statusPool: [string, number][] = [
    ["done", 55], ["cancelled", 12], ["accepted", 10], ["pending", 9], ["completed_by_master", 9], ["reported", 5],
  ];
  const pickStatus = () => {
    let x = r() * 100;
    for (const [s, w] of statusPool) {
      if ((x -= w) <= 0) return s;
    }
    return "done";
  };

  const ORDER_COUNT = 150;
  for (let i = 1; i <= ORDER_COUNT; i++) {
    const m = pick(masters, r);
    const c = pick(customers, r);
    const ageDays = Math.floor(Math.pow(r(), 1.6) * 45); // skewed to recent
    const status = pickStatus();
    const amount = Math.round((m.price * (0.8 + r() * 1.7)) / 5000) * 5000;
    const orderId = `demo_o_${i}`;
    const created = daysAgo(ageDays, r);
    const data: Record<string, unknown> = {
      masterId: m.id,
      masterName: `${m.first} ${m.last}`,
      masterCategory: m.cat.key,
      masterPhone: m.phone,
      userId: c.id,
      userName: c.name,
      phone: c.phone,
      address: `${m.place.region}, ${c.district}`,
      problem: pick(PROBLEMS, r),
      lat: m.place.lat + (r() - 0.5) * 0.08,
      lng: m.place.lng + (r() - 0.5) * 0.08,
      status,
      createdAt: created,
      isDemo: true,
    };
    if (status === "done" || status === "completed_by_master") data.masterConfirmedPrice = amount;
    if (status === "done") {
      data.clientConfirmedPrice = amount;
      data.finalPrice = amount;
    }
    if (status === "cancelled") data.cancellationReason = "Rejalar o'zgardi";
    if (status === "reported") data.complaintReason = "Narx kelishilganidan yuqori so'raldi";
    sink.set(ref("orders", orderId), data);
    summary.orders++;

    if (status === "done") {
      const x = r();
      const rating = x < 0.58 ? 5 : x < 0.85 ? 4 : x < 0.95 ? 3 : x < 0.98 ? 2 : 1;
      sink.set(ref("reviews", `${orderId}_c2m`), {
        orderId, fromId: c.id, toId: m.id, direction: "c2m", rating,
        comment: pick(COMMENTS, r), authorName: c.name, createdAt: created, isDemo: true,
      });
      summary.reviews++;
      if (r() < 0.7) {
        sink.set(ref("reviews", `${orderId}_m2c`), {
          orderId, fromId: m.id, toId: c.id, direction: "m2c", rating: r() < 0.8 ? 5 : 4,
          comment: "Yaxshi mijoz, to'lov o'z vaqtida.", authorName: `${m.first} ${m.last}`, createdAt: created, isDemo: true,
        });
        summary.reviews++;
      }
    }
  }

  return { docs: sink.docs, summary };
}

/** Writes the demo data to Firestore (admin only). */
export async function seedDemoData(): Promise<SeedSummary> {
  const { docs, summary } = buildDemoDocs();
  const b = new Batcher();
  for (const d of docs) await b.set(doc(db, d.col, d.id), d.data);
  await b.done();
  return summary;
}


/** Deletes every document flagged isDemo in the four demo-capable collections. */
export async function clearDemoData(): Promise<number> {
  const b = new Batcher();
  for (const name of ["reviews", "orders", "masters", "users"]) {
    const snap = await getDocs(query(collection(db, name), where("isDemo", "==", true)));
    for (const d of snap.docs) await b.del(d.ref);
  }
  await b.done();
  return b.total;
}
