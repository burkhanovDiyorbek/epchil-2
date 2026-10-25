"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useReviews, createReview } from "@/lib/reviews";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, tr } from "@/components/language-provider";
import {
  User, Phone, MapPin, DollarSign, Instagram, MessageCircle,
  Globe, Loader2, Package, Star, Clock, CheckCircle2, Edit3,
  AlertTriangle, Calendar, TrendingUp, XCircle, PhoneCall,
  Search, MessageSquare, AlertCircle, Info, Navigation, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegionDistrictFields } from "@/components/forms/RegionDistrictFields";
import { formatUzPhone } from "@/lib/phone-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_TABS_LIST, PROFILE_TAB_TRIGGER, COUNT_BADGE, cleanTabLabel } from "./tab-styles";
import { ChatModal } from "@/components/booking/ChatModal";
import type { ChatParty } from "@/lib/chat";
import { buildOrderStats } from "@/lib/order-analytics";
import { Badge } from "@/components/ui/badge";

// ─── Local Profile Components ───────────────────────────────────────────────
import { Field } from "./Field";
import { StatusBadge } from "./StatusBadge";
import { SaveSection } from "./SaveSection";
import { NavigationIcon } from "./NavigationIcon";
import { CancelReasonModal } from "./CancelReasonModal";
import { ReviewConfirmModal } from "./ReviewConfirmModal";
import { sendNotification } from "./notifications";
import locales from "./locales.json";

const customerSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta harf"),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length === 12, "Telefon raqamini to'liq kiriting"),
  bio: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Order {
  id: string;
  masterId?: string;
  masterName?: string;
  masterCategory?: string;
  masterPhone?: string;
  userId?: string;
  problem: string;
  address: string;
  phone: string;
  lat?: number;
  lng?: number;
  status: string;
  createdAt?: any;
  cancellationReason?: string;
  masterConfirmedPrice?: number;
  clientConfirmedPrice?: number;
  finalPrice?: number;
  masterRatingByClient?: number;
  masterReviewByClient?: string;
  clientRatingByMaster?: number;
  clientReviewByMaster?: string;
}

interface CustomerProfileProps {
  triggerToast: (msg: string, desc?: string, type?: "success" | "error" | "info") => void;
}

export function CustomerProfile({ triggerToast }: CustomerProfileProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { locale } = useLanguage();
  const t = (locales as Record<string, typeof locales.uz>)[locale] || locales.uz;

  const [orders, setOrders] = useState<Order[]>([]);

  // Chat: the open conversation (full inbox lives at /messages)
  const [activeChat, setActiveChat] = useState<ChatParty | null>(null);
  const openOrderChat = (order: Order) => {
    if (!user || !order.masterId) return;
    setActiveChat({
      customerId: user.uid,
      masterId: order.masterId,
      customerName: profile?.name || user.displayName || "",
      masterName: order.masterName || "",
      masterCategory: order.masterCategory,
    });
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cancellation and confirmation states
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

  // Home coordinates map selection state
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Schedule local state (Beta)
  const [scheduleState, setScheduleState] = useState<Record<number, number[]>>({
    0: [0, 1], // Mon
    1: [0, 1], // Tue
    2: [0, 1], // Wed
    3: [0, 1], // Thu
    4: [0, 1], // Fri
    5: [1],    // Sat
    6: [],     // Sun
  });

  // Period-based dynamic analytics figures (Beta)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");

  // Reviews search & reply local states (Beta)
  const [reviewSearch, setReviewSearch] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  // Reviews masters wrote about this customer (real, from the reviews collection)
  const { reviews: liveReviews, summary: reviewSummary } = useReviews(user?.uid, "m2c");
  const reviewsList = useMemo(
    () =>
      liveReviews.map((r) => ({
        id: r.id,
        author: r.authorName || "—",
        rating: r.rating,
        date: r.createdAt ? r.createdAt.toLocaleDateString() : "",
        comment: r.comment,
        replies: [] as string[],
      })),
    [liveReviews]
  );

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      region: profile?.region || "",
      district: profile?.district || "",
      telegram: profile?.telegram || "",
      instagram: profile?.instagram || "",
      website: profile?.website || "",
    },
  });

  const phoneVal = form.watch("phone") || "";
  useEffect(() => {
    const formatted = formatUzPhone(phoneVal);
    if (formatted !== phoneVal) {
      form.setValue("phone", formatted, { shouldValidate: true });
    }
  }, [phoneVal, form]);

  // Load coordinates and auto-detect if none saved
  useEffect(() => {
    if (profile?.lat && profile?.lng) {
      setCustomerCoords({ lat: profile.lat, lng: profile.lng });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCustomerCoords({ lat: 41.311081, lng: 69.240562 })
      );
    } else {
      setCustomerCoords({ lat: 41.311081, lng: 69.240562 });
    }
  }, [profile]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        const interval = setInterval(() => {
          if ((window as any).L) {
            setLeafletLoaded(true);
            clearInterval(interval);
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, []);

  // Initialize client picker map in "Profile" tab
  useEffect(() => {
    if (!leafletLoaded || !customerCoords) return;

    const L = (window as any).L;
    if (!L) return;

    const timer = setTimeout(() => {
      const mapDiv = document.getElementById("customer-map");
      if (!mapDiv) return;

      if (mapRef.current) {
        mapRef.current.setView([customerCoords.lat, customerCoords.lng], 14);
        if (markerRef.current) {
          markerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
        }
        return;
      }

      const map = L.map("customer-map", {
        zoomControl: false,
        attributionControl: false
      }).setView([customerCoords.lat, customerCoords.lng], 14);

      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
                 <div class="w-3.5 h-3.5 bg-white rounded-full"></div>
               </div>`,
        className: "customer-map-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([customerCoords.lat, customerCoords.lng], { icon: customIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", async (e: any) => {
        const pos = e.target.getLatLng();
        setCustomerCoords({ lat: pos.lat, lng: pos.lng });
      });

      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setCustomerCoords({ lat: clickLat, lng: clickLng });
        marker.setLatLng([clickLat, clickLng]);
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded, customerCoords === null]);

  // Real-time orders: new orders and status changes show up instantly.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(data);
      },
      (e) => console.error("Orders listener error:", e)
    );
    return () => unsubscribe();
  }, [user]);

  // Orders are live now; kept so existing handlers can still `await` it.
  const fetchOrders = async () => {};

  const onSubmit = async (data: CustomerFormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        bio: data.bio || "",
        region: data.region || "",
        district: data.district || "",
        telegram: data.telegram || "",
        instagram: data.instagram || "",
        website: data.website || "",
        lat: customerCoords?.lat || 41.311081,
        lng: customerCoords?.lng || 69.240562
      };
      await updateDoc(doc(db, "users", user.uid), payload);
      await refreshProfile();
      setSaved(true);
      triggerToast(t.savedSuccess, "", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      triggerToast(tr(locale, "Xatolik yuz berdi", "Произошла ошибка", "An error occurred"), "", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Status handler (Cancel Order with Reason)
  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingOrder) return;
    try {
      await updateDoc(doc(db, "orders", cancellingOrder.id), {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: "client"
      });
      await sendNotification(
        cancellingOrder.masterId!,
        tr(locale, "Buyurtmangiz bekor qilindi", "Заказ отменен", "Order cancelled"),
        tr(locale, `Mijoz buyurtmasini bekor qildi. Sabab: ${reason}`, `Клиент отменил заказ. Причина: ${reason}`, `The client cancelled the order. Reason: ${reason}`),
        cancellingOrder.id,
        "cancelled"
      );
      triggerToast(tr(locale, "Buyurtma bekor qilindi", "Заказ отменен", "Order cancelled"), "", "info");
      setCancellingOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  // Status handler (Approve completed order & Recalculate Master Ratings)
  const handleCompleteConfirm = async (data: { rating: number; comment: string; price: number }) => {
    if (!confirmingOrder) return;
    try {
      // 1. Update order status and details in Firestore
      await updateDoc(doc(db, "orders", confirmingOrder.id), {
        status: "done",
        clientConfirmedPrice: data.price,
        finalPrice: data.price, // standard final price
        masterRatingByClient: data.rating,
        masterReviewByClient: data.comment
      });

      // 2. Notify the master
      await sendNotification(
        confirmingOrder.masterId!,
        tr(locale, "Ish qabul qilindi!", "Работа принята!", "Work accepted!"),
        tr(locale, `Mijoz ish sifatini tasdiqladi va yakuniy narxni ${data.price.toLocaleString()} UZS deb kiritdi. Sizni baholadi: ${data.rating} ⭐`, `Клиент подтвердил выполнение и указал стоимость ${data.price.toLocaleString()} UZS. Оценил вас: ${data.rating} ⭐`, `The client confirmed completion and set the price at ${data.price.toLocaleString()} UZS. Rated you: ${data.rating} ⭐`),
        confirmingOrder.id,
        "done"
      );

      // 3. Public review of the master: the ONLY source of the master's rating.
      //    (Written after the order became "done" because the security rules check the order.)
      await createReview({
        orderId: confirmingOrder.id,
        fromId: user!.uid,
        toId: confirmingOrder.masterId!,
        direction: "c2m",
        rating: data.rating,
        comment: data.comment,
        authorName: profile?.name || user?.displayName || "",
      });

      triggerToast(
        tr(locale, "Ish tasdiqlandi! Rahmat!", "Работа подтверждена! Спасибо!", "Work confirmed! Thank you!"),
        "",
        "success"
      );
      setConfirmingOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Shifts handler (Beta)
  const toggleSlot = (dayIndex: number, slotIndex: number, dayName: string, slotName: string) => {
    setScheduleState(prev => {
      const current = prev[dayIndex] || [];
      const updated = current.includes(slotIndex)
        ? current.filter(i => i !== slotIndex)
        : [...current, slotIndex];

      const stateText = current.includes(slotIndex)
        ? (tr(locale, "o'chirildi", "отключен", "disabled"))
        : (tr(locale, "faollashtirildi", "активирован", "enabled"));

      triggerToast(
        tr(locale, "Jadval sozlandi", "График настроен", "Schedule updated"),
        `${dayName} (${slotName}) — ${stateText} [Beta]`,
        "info"
      );

      return { ...prev, [dayIndex]: updated };
    });
  };

  // Expenditures dynamic metrics based on real completed orders final price
  const doneOrdersList = orders.filter(o => o.status === "done");
  const periodStats = buildOrderStats(orders, locale);
  const toView = (p: "weekly" | "monthly" | "yearly") => ({
    earnings: `${periodStats[p].amount.toLocaleString()} UZS`,
    completed: String(periodStats[p].completed),
    pending: String(periodStats[p].pending),
    rating: reviewSummary.average !== null ? `${reviewSummary.average.toFixed(1)} / 5.0` : "—",
    trends: periodStats[p].trends,
    labels: periodStats[p].labels,
  });
  const expendituresData = { weekly: toView("weekly"), monthly: toView("monthly"), yearly: toView("yearly") };
  const currentPeriodSpent = expendituresData[analyticsPeriod];

  return (
    <>
      <ChatModal isOpen={!!activeChat} onClose={() => setActiveChat(null)} chat={activeChat} />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={PROFILE_TABS_LIST}>
          <TabsTrigger value="profile" className={PROFILE_TAB_TRIGGER}>
            <User size={15} /> {tr(locale, "Profil", "Профиль", "Profile")}
          </TabsTrigger>
          <TabsTrigger value="orders" className={PROFILE_TAB_TRIGGER}>
            <Package size={15} /> {tr(locale, "Buyurtmalar", "Заказы", "Orders")} <span className={COUNT_BADGE}>{orders.length}</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className={PROFILE_TAB_TRIGGER}>
            <TrendingUp size={15} /> {tr(locale, "Xarajat", "Расход", "Spending")}
          </TabsTrigger>
          <TabsTrigger value="reviews" className={PROFILE_TAB_TRIGGER}>
            <Star size={15} /> {tr(locale, "Sharhlar", "Отзывы", "Reviews")}
          </TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Field label={t.fullName} icon={<User size={13} />} error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" placeholder="Ismingiz" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t.phone} icon={<Phone size={13} />} error={form.formState.errors.phone?.message}>
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 placeholder-slate-400"
                        placeholder="+998 (90) 123-45-67"
                        onFocus={() => { if (!field.value) field.onChange("+998"); }}
                        onChange={(e) => field.onChange(formatUzPhone(e.target.value))}
                      />
                    )}
                  />
                </Field>
                <Field label={t.email}>
                  <Input value={user?.email || "—"} disabled className="h-12 rounded-xl opacity-60 bg-slate-100 dark:bg-slate-900/60" />
                </Field>
              </div>

              <Controller
                control={form.control}
                name="region"
                render={({ field: regionField }) => (
                  <Controller
                    control={form.control}
                    name="district"
                    render={({ field: districtField }) => (
                      <RegionDistrictFields
                        region={regionField.value ?? ""}
                        district={districtField.value ?? ""}
                        onRegionChange={regionField.onChange}
                        onDistrictChange={districtField.onChange}
                        regionError={form.formState.errors.region?.message}
                        districtError={form.formState.errors.district?.message}
                        regionLabel={<Label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm"><MapPin size={13} /> {t.region}</Label>}
                        districtLabel={<Label className="text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm">{t.district}</Label>}
                      />
                    )}
                  />
                )}
              />

              {/* Home coordinate picker map */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Navigation size={13} className="text-[#F97316] animate-pulse" />
                  {tr(locale, "Uyingiz/Ishxonangiz koordinatalari (Xaritadan belgilang):", "Координаты дома/офиса (Укажите на карте):", "Home/office coordinates (mark on the map):")}
                </Label>

                <div className="h-44 rounded-2xl w-full overflow-hidden relative border border-slate-200/50 dark:border-slate-800/40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <div id="customer-map" className="w-full h-full rounded-2xl z-10" style={{ minHeight: "176px" }} />

                  {!leafletLoaded && (
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-400 font-semibold gap-2 animate-pulse z-20">
                      <Loader2 className="animate-spin text-[#F97316]" size={20} />
                      <span>{tr(locale, "Xarita yuklanmoqda...", "Карта загружается...", "Loading map...")}</span>
                    </div>
                  )}

                  {customerCoords && (
                    <div className="absolute bottom-2 left-2 bg-slate-950/75 text-[9px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none z-20">
                      <CheckCircle2 size={10} className="text-green-400 animate-pulse" />
                      <span>{t.masterMapHint}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label={t.bio}>
                <Textarea {...form.register("bio")} className="rounded-xl min-h-[90px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" placeholder="Qo'shimcha tafsilotlar..." />
              </Field>

              <SaveSection saved={saved} isSaving={isSaving} saveText={t.saveBtn} savedSuccessText={t.savedSuccess} />
            </motion.div>
          </TabsContent>
        </form>

        <TabsContent value="orders">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-sm">{t.noOrders}</p>
              </div>
            ) : (
              orders.map((order, i) => {
                const staticMapUrl = order.lat && order.lng
                  ? `https://static-maps.yandex.ru/1.x/?ll=${order.lng},${order.lat}&z=14&l=map&size=450,110&pt=${order.lng},${order.lat},pm2org`
                  : "";

                const isPendingConfirm = order.status === "completed_by_master";

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white dark:bg-slate-900/60 rounded-3xl p-5 border shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-[#F97316]/20 transition-all duration-300 ${
                      isPendingConfirm
                        ? "border-[#F97316] shadow-orange-500/10 shadow-md animate-pulse"
                        : "border-slate-200/50 dark:border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">{t.orderProblem}</span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">{order.problem || "—"}</h4>
                      </div>
                      <StatusBadge status={order.status} locale={locale} />
                    </div>

                    {/* Master Details */}
                    {order.masterName && (
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-900 flex justify-between items-center relative z-10">
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block mb-0.5">{tr(locale, "Buyurtma qilingan usta", "Заказанный мастер", "Ordered master")}</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Wrench size={11} className="text-[#F97316]" /> {order.masterName}
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">({order.masterCategory})</span>
                          </p>
                        </div>
                        {order.masterId && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openOrderChat(order)}
                            className="h-8 rounded-xl px-2.5 text-[10px] font-bold gap-1 bg-white dark:bg-slate-900"
                          >
                            <MessageSquare size={10} className="text-[#F97316]" /> {tr(locale, "Chat", "Чат", "Chat")}
                          </Button>
                        )}
                        {order.masterPhone && (
                          <a href={`tel:${order.masterPhone}`}>
                            <Button variant="outline" className="h-8 rounded-xl px-2.5 text-[10px] font-bold gap-1 bg-white dark:bg-slate-900">
                              <PhoneCall size={10} className="text-blue-500 animate-pulse" /> {t.callBtn}
                            </Button>
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 relative z-10 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#F97316] shrink-0" /> {order.address || "—"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="text-blue-500 shrink-0" /> {order.phone || "—"}
                      </p>

                      {/* Price tag display */}
                      {(order.status === "done" || order.status === "completed_by_master") && (
                        <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-extrabold text-[12px] bg-emerald-500/10 w-fit px-3 py-1 rounded-xl border border-emerald-500/10 shrink-0">
                          <DollarSign size={12} className="text-[#F97316]" />
                          {tr(locale, "Ish narxi: ", "Стоимость: ", "Cost: ")}
                          <span className="font-black">{Number(order.finalPrice || order.masterConfirmedPrice || 0).toLocaleString()} UZS</span>
                        </p>
                      )}

                      {/* Cancellation Reason Display */}
                      {order.status === "cancelled" && order.cancellationReason && (
                        <div className="col-span-1 p-2.5 rounded-xl border border-red-500/15 bg-red-500/5 text-red-500 text-[11px] font-bold leading-normal flex items-start gap-1.5 mt-1">
                          <AlertCircle size={13} className="shrink-0 mt-0.5" />
                          <p>
                            <span className="font-extrabold uppercase text-[9px] tracking-wider block mb-0.5">
                              {tr(locale, "Bekor qilinish sababi:", "Причина отмены:", "Cancellation reason:")}
                            </span>
                            {order.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Address static map preview */}
                    {staticMapUrl && (
                      <div className="h-28 rounded-2xl overflow-hidden relative border border-slate-200/50 dark:border-slate-800/30 bg-slate-50 dark:bg-slate-950/80">
                        <img
                          src={staticMapUrl}
                          alt="Location Map Preview"
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="absolute bottom-2 left-2 bg-slate-950/70 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide pointer-events-none">
                          <MapPin size={9} className="text-[#F97316]" /> {t.clientMapPreview}
                        </div>
                      </div>
                    )}

                    {/* Cancel action triggers reason Modal */}
                    {order.status === "pending" && (
                      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
                        <Button
                          onClick={() => setCancellingOrder(order)}
                          variant="outline"
                          className="h-9 rounded-xl px-3.5 text-xs font-bold text-red-500 border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 active:scale-[0.97] transition-all"
                        >
                          <XCircle size={14} /> {t.cancelBtn}
                        </Button>
                      </div>
                    )}

                    {/* Glowing confirm trigger button for customer */}
                    {isPendingConfirm && (
                      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
                        <Button
                          onClick={() => setConfirmingOrder(order)}
                          className="h-10 rounded-xl px-5 text-xs font-extrabold text-white bg-green-500 hover:bg-green-600 gap-1.5 active:scale-[0.97] transition-all shadow-md shadow-green-500/20 animate-bounce"
                        >
                          <CheckCircle2 size={14} />
                          {tr(locale, "Tasdiqlash & Baholash", "Подтвердить & Оценить", "Confirm & Rate")}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </TabsContent>

        {/* 📊 [BETA] Interactive Expenditures Analytics Dashboard */}
        <TabsContent value="analytics">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#F97316] text-white border-0 text-[9px] font-extrabold uppercase shrink-0">
                  {t.betaTitle}
                </Badge>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {tr(locale, "Sizning xarajatlaringiz", "Ваши расходы", "Your spending")} — {t.betaDesc}
                </p>
              </div>

              {/* Period Toggles */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl flex w-fit">
                {([
                  { key: "weekly", label: t.periodWeekly },
                  { key: "monthly", label: t.periodMonthly },
                  { key: "yearly", label: t.periodYearly }
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setAnalyticsPeriod(key);
                      triggerToast(tr(locale, "Davr almashtirildi", "Период изменен", "Period changed"), `${label} [Beta]`, "info");
                    }}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      analyticsPeriod === key
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Cards Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={analyticsPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-green-500/10 border border-green-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-green-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">
                    {tr(locale, "Umumiy xarajat", "Итого расходов", "Total spending")}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400">{currentPeriodSpent.earnings}</span>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-blue-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">
                    {tr(locale, "Olingan xizmatlar", "Получено услуг", "Services received")}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">{currentPeriodSpent.completed}</span>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-yellow-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">
                    {tr(locale, "Kutilayotganlar", "В ожидании", "Pending")}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">{currentPeriodSpent.pending}</span>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-purple-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">
                    {tr(locale, "Sizning reytingingiz", "Ваш рейтинг", "Your rating")}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">{currentPeriodSpent.rating}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Premium Symmetrical Grid Trend Chart */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner space-y-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block uppercase tracking-wider">
                {tr(locale, "Xarajatlar tendensiyasi", "Тенденция расходов", "Spending trend")}
              </span>

              <div className="h-32 flex items-end justify-between gap-2.5 px-3 pt-6 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-0 top-6 border-t border-slate-200/40 dark:border-slate-800/40 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 border-t border-slate-200/40 dark:border-slate-800/40 pointer-events-none" />

                {currentPeriodSpent.trends.map((val, idx) => {
                  const max = Math.max(...currentPeriodSpent.trends) || 1;
                  const heightPct = Math.max(8, (val / max) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950 text-white text-[8px] font-bold px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-20">
                        {val.toLocaleString()} UZS
                      </div>

                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15, delay: idx * 0.05 }}
                        className={`w-full max-w-[24px] rounded-t-lg bg-gradient-to-t transition-all duration-300 shadow-sm ${
                          val > 0
                            ? "from-[#F97316] to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 shadow-orange-500/10"
                            : "from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 opacity-30"
                        }`}
                      />

                      <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-1">
                        {currentPeriodSpent.labels[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ⭐ [BETA] Client Reviews Tab */}
        <TabsContent value="reviews">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border border-orange-500/15">
              <Badge className="bg-[#F97316] text-white border-0 text-[9px] font-extrabold uppercase shrink-0">
                {t.betaTitle}
              </Badge>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {tr(locale, "Sizga ustalar tomondan yozilgan fikrlar", "Отзывы мастеров о вас", "Reviews from masters about you")} — {t.betaDesc}
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder={t.searchReviewPlaceholder}
                  className="pl-9 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList
                .filter(rev => rev.author.toLowerCase().includes(reviewSearch.toLowerCase()) || rev.comment.toLowerCase().includes(reviewSearch.toLowerCase()))
                .map((rev) => (
                  <div key={rev.id} className="bg-slate-50/50 dark:bg-slate-900/40 p-4 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex flex-col gap-2.5 shadow-sm group hover:border-[#F97316]/10 transition-all duration-300">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white">{rev.author}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                      <Star size={12} fill="currentColor" /> {rev.rating}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-355 leading-relaxed font-semibold italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ─── Cancel Reason Modal ────────────────────────────────────────────────── */}
      <CancelReasonModal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onConfirm={handleCancelConfirm}
        locale={locale}
      />

      {/* ─── Reciprocal Review Confirmation Modal (Client Mode) ────────────────── */}
      <ReviewConfirmModal
        isOpen={!!confirmingOrder}
        onClose={() => setConfirmingOrder(null)}
        onConfirm={handleCompleteConfirm}
        locale={locale}
        mode="client"
        partnerName={confirmingOrder?.masterName || tr(locale, "Usta", "Мастер", "Master")}
        partnerPrice={confirmingOrder?.masterConfirmedPrice}
        basePrice={confirmingOrder?.masterConfirmedPrice || 10000}
      />
    </>
  );
}
