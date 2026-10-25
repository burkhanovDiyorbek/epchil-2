# Epchil AI Agent

AI yordamida uy xizmatlari ustalarini topish va chaqirish platformasi (MVP). O'zbekcha, ruscha va inglizcha.

## Imkoniyatlar
- AI qidiruv (matn yoki ovoz) → kasb, hudud, shoshilinchlik aniqlanadi (`/api/match`, Gemini + zaxira klassifikator)
- Ustalar katalogi, filtrlar, tekshirilgan ustalar yuqorida
- Buyurtma berish (xaritada manzil), usta qabul qiladi / rad etadi / yakunlaydi
- **Mijoz va usta o'rtasida real vaqtdagi chat** (`/messages`), o'qilmagan xabarlar, brauzer bildirishnomalari
- Mijoz va usta profillari, buyurtmalar (real vaqtda), daromad/xarajat statistikasi (haqiqiy buyurtmalardan)
- **Reyting faqat sharhlardan hisoblanadi** (`reviews` kolleksiyasi): hech kim reytingni qo'lda o'zgartira olmaydi
- **Admin panel** (`/admin`): umumiy statistika, ustalarni tekshirish/yashirish, buyurtmalar, foydalanuvchilarni bloklash, sharhlarni boshqarish, CSV eksport, demo ma'lumot
- Light/dark rejim, mobil moslashuv

## Ishga tushirish
```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` (namuna):
```
GEMINI_API_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# ixtiyoriy
NEXT_PUBLIC_ADMIN_EMAILS=email1@gmail.com,email2@gmail.com
NEXT_PUBLIC_SHOW_DEMO_MASTERS=1
```

## Firestore qoidalari (majburiy)
Chat, buyurtma, reyting va admin ishlashi uchun [`firestore.rules`](firestore.rules) Firebase'ga yuklangan bo'lishi kerak:

- Firebase Console → Firestore Database → Rules → fayl matnini qo'ying → **Publish**, yoki
- `npx firebase-tools deploy --only firestore:rules --project <project-id>`

Qoidalar yangilanmasa: katalog, profil, chat yoki admin panel "Missing or insufficient permissions" xatosini beradi.

## Admin panel
`/admin` faqat administratorlarga ochiq. Admin bo'lish:
1. Google/Gmail hisobingiz `lib/admin.ts` va `firestore.rules` dagi `isAdmin()` ro'yxatida bo'lsa (email tasdiqlangan bo'lishi shart), yoki
2. Firebase Console → Firestore → `admins` kolleksiyasiga hujjat qo'shing (hujjat id = foydalanuvchi uid). Qayta deploy kerak emas.

**Asboblar → Demo ma'lumot yaratish** soxta usta/mijoz/buyurtma/sharhlarni yaratadi. Hammasi `isDemo` bilan belgilanadi, ommaviy katalogda ko'rinmaydi (ko'rsatish uchun `NEXT_PUBLIC_SHOW_DEMO_MASTERS=1`) va bitta tugma bilan o'chiriladi. Autentifikatsiya hisoblari yaratilmaydi.

## Ma'lumotlar modeli
| Kolleksiya | Hujjat id | Mazmuni |
|---|---|---|
| `users` | uid | profil (rol: `customer` / `master`), `blocked` faqat admin |
| `masters` | uid | ommaviy usta kartochkasi, `isVerified` / `isHidden` faqat admin |
| `orders` | auto | buyurtma: `userId`, `masterId`, `status` |
| `reviews` | `<orderId>_c2m` / `_m2c` | reyting va sharh; faqat yaratish mumkin, tahrirlab bo'lmaydi |
| `chats` | `<customerId>_<masterId>` | suhbat; `messages` ichki kolleksiya |
| `notifications` | auto | `userId` ga yo'naltirilgan bildirishnoma |
| `admins` | uid | qo'lda yaratiladigan administrator belgisi |

## Ma'lum cheklovlar (keyingi qadamlar)
- Reyting o'rtachasi o'qish paytida hisoblanadi (katalog barcha mijoz sharhlarini o'qiydi). Foydalanuvchi ko'payganda Cloud Function bilan agregatga ko'chirish kerak
- Buyurtma holati o'zgarishlari qoidalar bilan cheklangan, lekin to'liq holat mashinasi emas
- To'lov integratsiyasi yo'q (naqd)
- Telegram bot va mobil ilova rejada
