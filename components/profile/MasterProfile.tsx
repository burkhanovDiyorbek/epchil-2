"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useReviews, createReview } from "@/lib/reviews";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, tr } from "@/components/language-provider";
import {
  User, Wrench, Phone, MapPin, DollarSign, Instagram, MessageCircle,
  Globe, Loader2, Package, Star, Clock, CheckCircle2, Edit3,
  AlertTriangle, Calendar, TrendingUp, XCircle, PhoneCall,
  Search, MessageSquare, AlertCircle, Info, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/select";
import { RegionDistrictFields } from "@/components/forms/RegionDistrictFields";
import { formatUzPhone } from "@/lib/phone-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_TABS_LIST, PROFILE_TAB_TRIGGER, BETA_BADGE, COUNT_BADGE, cleanTabLabel } from "./tab-styles";
import { ChatModal } from "@/components/booking/ChatModal";
import type { ChatParty } from "@/lib/chat";
import { buildOrderStats } from "@/lib/order-analytics";
import { categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// ─── Local Profile Components ───────────────────────────────────────────────
import { Field } from "./Field";
import { StatusBadge } from "./StatusBadge";
import { SaveSection } from "./SaveSection";
import { NavigationIcon } from "./NavigationIcon";
import { CancelReasonModal } from "./CancelReasonModal";
import { ReviewConfirmModal } from "./ReviewConfirmModal";
import { sendNotification } from "./notifications";
import locales from "./locales.json";

const masterSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta harf"),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length === 12, "Telefon raqamini to'liq kiriting"),
  bio: z.string().optional(),
  category: z.string().min(1, "Kasb kiritish majburiy"),
  services: z.string().min(2, "Xizmatlarni kiriting"),
  basePrice: z.preprocess((v) => Number(v), z.number().min(1000, "Narx kiriting")),
  region: z.string().min(2, "Viloyat kiriting"),
  district: z.string().min(2, "Tuman kiriting"),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
});

type MasterFormData = {
  name: string;
  phone?: string;
  bio?: string;
  category: string;
  services: string;
  basePrice: number;
  region: string;
  district: string;
  telegram?: string;
  instagram?: string;
  website?: string;
};

interface Order {
  id: string;
  masterId?: string;
  masterName?: string;
  masterCategory?: string;
  masterPhone?: string;
  userId?: string;
  userName?: string;
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
  clientRatingByMaster?: number;
  clientReviewByMaster?: string;
}

interface MasterProfileProps {
  triggerToast: (msg: string, desc?: string, type?: "success" | "error" | "info") => void;
}

// ─── Distance Calculator (Haversine Formula) ─────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MasterProfile({ triggerToast }: MasterProfileProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { locale } = useLanguage();
  const t = (locales as any)[locale] || locales.uz;

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Chat: the open conversation (full inbox lives at /messages)
  const [activeChat, setActiveChat] = useState<ChatParty | null>(null);
  const openOrderChat = (order: Order) => {
    if (!user || !order.userId) return;
    setActiveChat({
      customerId: order.userId,
      masterId: user.uid,
      customerName: order.userName || order.phone || "",
      masterName: profile?.name || user.displayName || "",
      masterCategory: profile?.category,
    });
  };

  // Bidirectional confirm and cancellation states
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);

  // Master coordinates map selection state
  const [masterCoords, setMasterCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Weekly schedule local state
  const [scheduleState, setScheduleState] = useState<Record<number, number[]>>({
    0: [0, 1], // Mon
    1: [0, 1], // Tue
    2: [0, 1], // Wed
    3: [0, 1], // Thu
    4: [0, 1], // Fri
    5: [1],    // Sat
    6: [],     // Sun
  });

  // Revenue analytics period and mock data
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");

  // Reviews search & reply local states
  const [reviewSearch, setReviewSearch] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  // Reviews customers wrote about this master (real, from the reviews collection)
  const { reviews: liveReviews, summary: reviewSummary } = useReviews(user?.uid, "c2m");
  const [reviewSort, setReviewSort] = useState<"newest" | "rating">("newest");
  // Replies are still a local Beta feature (not stored yet).
  const [localReplies, setLocalReplies] = useState<Record<string, string[]>>({});
  const reviewsList = useMemo(() => {
    const list = liveReviews.map((r) => ({
      id: r.id,
      author: r.authorName || "—",
      rating: r.rating,
      date: r.createdAt ? r.createdAt.toLocaleDateString() : "",
      comment: r.comment,
      ts: r.createdAt?.getTime() ?? 0,
      replies: localReplies[r.id] ?? [],
    }));
    list.sort(reviewSort === "newest" ? (a, b) => b.ts - a.ts : (a, b) => b.rating - a.rating);
    return list;
  }, [liveReviews, localReplies, reviewSort]);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyInputOpen, setReplyInputOpen] = useState<Record<string, boolean>>({});

  // Complaint modal status
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const form = useForm<MasterFormData>({
    resolver: zodResolver(masterSchema) as any,
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      category: profile?.category || "",
      services: profile?.services?.join(", ") || "",
      basePrice: profile?.basePrice || 0,
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
      setMasterCoords({ lat: profile.lat, lng: profile.lng });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMasterCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setMasterCoords({ lat: 41.311081, lng: 69.240562 })
      );
    } else {
      setMasterCoords({ lat: 41.311081, lng: 69.240562 });
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

  // Initialize master picker map in "Profile" tab
  useEffect(() => {
    if (!leafletLoaded || !masterCoords) return;

    const L = (window as any).L;
    if (!L) return;

    const timer = setTimeout(() => {
      const mapDiv = document.getElementById("master-map");
      if (!mapDiv) return;

      if (mapRef.current) {
        mapRef.current.setView([masterCoords.lat, masterCoords.lng], 14);
        if (markerRef.current) {
          markerRef.current.setLatLng([masterCoords.lat, masterCoords.lng]);
        }
        return;
      }

      const map = L.map("master-map", {
        zoomControl: false,
        attributionControl: false
      }).setView([masterCoords.lat, masterCoords.lng], 14);

      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
                 <div class="w-3.5 h-3.5 bg-white rounded-full"></div>
               </div>`,
        className: "master-map-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([masterCoords.lat, masterCoords.lng], { icon: customIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", async (e: any) => {
        const pos = e.target.getLatLng();
        setMasterCoords({ lat: pos.lat, lng: pos.lng });
      });

      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setMasterCoords({ lat: clickLat, lng: clickLng });
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
  }, [leafletLoaded, masterCoords === null]);

  // Real-time orders: new orders and status changes show up instantly.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("masterId", "==", user.uid));
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

  const onSubmit = async (data: MasterFormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const servicesArr = data.services.split(",").map(s => s.trim()).filter(Boolean);
      const payload = {
        name: data.name, phone: data.phone, bio: data.bio,
        category: data.category, services: servicesArr,
        basePrice: data.basePrice, region: data.region, district: data.district,
        telegram: data.telegram || "", instagram: data.instagram || "", website: data.website || "",
        firstName: data.name.split(" ")[0] || data.name,
        lastName: data.name.split(" ").slice(1).join(" ") || "",
        lat: masterCoords?.lat || 41.311081,
        lng: masterCoords?.lng || 69.240562
      };
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), payload),
        updateDoc(doc(db, "masters", user.uid), payload),
      ]);
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

  // Status handler (Accept Order)
  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateDoc(doc(db, "orders", order.id), { status: "accepted" });
      await sendNotification(
        order.userId!,
        tr(locale, "Buyurtmangiz qabul qilindi!", "Ваш заказ принят!", "Your order was accepted!"),
        tr(locale, `Usta ${profile?.name || "Usta"} buyurtmangizni qabul qildi. Telefon: ${profile?.phone}`, `Мастер ${profile?.name || "Мастер"} принял ваш заказ. Телефон: ${profile?.phone}`, `Master ${profile?.name || "Master"} accepted your order. Phone: ${profile?.phone}`),
        order.id,
        "accepted"
      );
      triggerToast(t.acceptSuccess, "", "success");
      await fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast(tr(locale, "Xatolik", "Ошибка", "Error"), "", "error");
    }
  };

  // Status handler (Reject Order with Reason)
  const handleRejectConfirm = async (reason: string) => {
    if (!cancellingOrder) return;
    try {
      await updateDoc(doc(db, "orders", cancellingOrder.id), {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: "master"
      });
      await sendNotification(
        cancellingOrder.userId!,
        tr(locale, "Buyurtmangiz rad etildi", "Ваш заказ отклонен", "Your order was declined"),
        tr(locale, `Usta ${profile?.name || "Usta"} buyurtmangizni bekor qildi. Sabab: ${reason}`, `Мастер ${profile?.name || "Мастер"} отменил ваш заказ. Причина: ${reason}`, `Master ${profile?.name || "Master"} cancelled your order. Reason: ${reason}`),
        cancellingOrder.id,
        "cancelled"
      );
      triggerToast(t.rejectSuccess, "", "success");
      setCancellingOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast(tr(locale, "Xatolik", "Ошибка", "Error"), "", "error");
    }
  };

  // Status handler (Submit Complete with Final Price & Client Review)
  const handleCompleteConfirm = async (data: { rating: number; comment: string; price: number }) => {
    if (!completingOrder) return;
    try {
      await updateDoc(doc(db, "orders", completingOrder.id), {
        status: "completed_by_master",
        masterConfirmedPrice: data.price,
        clientRatingByMaster: data.rating,
        clientReviewByMaster: data.comment,
        completedAt: new Date()
      });
      // Private review of the customer (m2c): written after the order status changed.
      await createReview({
        orderId: completingOrder.id,
        fromId: user!.uid,
        toId: completingOrder.userId!,
        direction: "m2c",
        rating: data.rating,
        comment: data.comment,
        authorName: profile?.name || user?.displayName || "",
      });
      await sendNotification(
        completingOrder.userId!,
        tr(locale, "Ish yakunlandi! (Tasdiqlash kutilmoqda)", "Работа завершена! (Ожидает подтверждения)", "Work completed! (Awaiting confirmation)"),
        tr(locale, `Usta ${profile?.name || "Usta"} ishni bitirganini ma'lum qildi va narxni ${data.price.toLocaleString()} UZS deb kiritdi. Iltimos, ishni tasdiqlang va baholang!`, `Мастер ${profile?.name || "Мастер"} завершил работу и указал стоимость в ${data.price.toLocaleString()} UZS. Пожалуйста, подтвердите и оцените!`, `Master ${profile?.name || "Master"} finished the work and set the price at ${data.price.toLocaleString()} UZS. Please confirm and rate!`),
        completingOrder.id,
        "completed_by_master"
      );
      triggerToast(
        tr(locale, "Ish yakunlandi! Mijoz tasdiqlashi kutilmoqda", "Работа завершена! Ожидается подтверждение клиента", "Work completed! Awaiting client confirmation"),
        "",
        "success"
      );
      setCompletingOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      triggerToast(tr(locale, "Xatolik", "Ошибка", "Error"), "", "error");
    }
  };

  // Submit Complaint
  const handleSendReport = async () => {
    if (!selectedOrderForReport) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrderForReport), {
        status: "reported",
        complaintReason: reportReason,
        reportedAt: new Date()
      });
      await sendNotification(
        orders.find(o => o.id === selectedOrderForReport)?.userId!,
        tr(locale, "Shikoyat yuborildi", "Отправлена жалоба", "Report submitted"),
        tr(locale, `Usta buyurtmangiz yuzasidan moderatsiyaga shikoyat yubordi.`, `Мастер отправил жалобу модераторам по вашему заказу.`, `The master submitted a report to moderators about your order.`),
        selectedOrderForReport,
        "reported"
      );
      setSelectedOrderForReport(null);
      setReportReason("");
      triggerToast(t.reportSuccess, "", "info");
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Shifts handler
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
        tr(locale, "Ish jadvali yangilandi", "График работы изменен", "Work schedule updated"),
        `${dayName} (${slotName}) — ${stateText} [Beta]`,
        "info"
      );

      return { ...prev, [dayIndex]: updated };
    });
  };

  const completedOrders = orders.filter(o => o.status === "done");
  const periodStats = buildOrderStats(orders, locale);
  const toView = (p: "weekly" | "monthly" | "yearly") => ({
    earnings: `${periodStats[p].amount.toLocaleString()} UZS`,
    completed: String(periodStats[p].completed),
    pending: String(periodStats[p].pending),
    rating: reviewSummary.average !== null ? `${reviewSummary.average.toFixed(1)} / 5.0` : "—",
    trends: periodStats[p].trends,
    labels: periodStats[p].labels,
  });
  const analyticsData = { weekly: toView("weekly"), monthly: toView("monthly"), yearly: toView("yearly") };
  const currentPeriodData = analyticsData[analyticsPeriod];

  // Sorting & Filtering Reviews
  const handleSortReviews = (criteria: "newest" | "rating") => setReviewSort(criteria);

  const filteredReviews = reviewsList.filter(rev => {
    const matchesSearch = rev.author.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                          rev.comment.toLowerCase().includes(reviewSearch.toLowerCase());
    const matchesRating = selectedRatingFilter === null ? true : Math.floor(rev.rating) === selectedRatingFilter;
    return matchesSearch && matchesRating;
  });

  const handleAddReply = (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;

    setLocalReplies(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] ?? []), text] }));

    setReplyTextMap(prev => ({ ...prev, [reviewId]: "" }));
    setReplyInputOpen(prev => ({ ...prev, [reviewId]: false }));

    triggerToast(
      tr(locale, "Javobingiz saqlandi", "Ответ сохранен", "Reply saved"),
      tr(locale, "Mijoz fikriga javob yozildi [Beta]", "Ответ на отзыв добавлен [Бета]", "Review reply added [Beta]"),
      "success"
    );
  };

  const CATEGORIES = ["santexnik", "elektrik", "kafelchi", "romchi", "tozalovchi", "duradgor", "konditsioner", "quruvchi", "rassom", "maishiy texnika", "boshqa"];

  return (
    <>
      <ChatModal isOpen={!!activeChat} onClose={() => setActiveChat(null)} chat={activeChat} />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={PROFILE_TABS_LIST}>
          <TabsTrigger value="profile" className={PROFILE_TAB_TRIGGER}>
            <Edit3 size={15} /> {tr(locale, "Profil", "Профиль", "Profile")}
          </TabsTrigger>
          <TabsTrigger value="orders" className={PROFILE_TAB_TRIGGER}>
            <Package size={15} /> {tr(locale, "Buyurtmalar", "Заказы", "Orders")} <span className={COUNT_BADGE}>{orders.length}</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className={PROFILE_TAB_TRIGGER}>
            <Calendar size={15} /> {tr(locale, "Jadval", "График", "Schedule")} <span className={BETA_BADGE}>Beta</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className={PROFILE_TAB_TRIGGER}>
            <TrendingUp size={15} /> {tr(locale, "Daromad", "Доход", "Earnings")} <span className={BETA_BADGE}>Beta</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className={PROFILE_TAB_TRIGGER}>
            <Star size={15} /> {tr(locale, "Sharhlar", "Отзывы", "Reviews")} <span className={BETA_BADGE}>Beta</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t.fullName} icon={<User size={13} />} error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 placeholder-slate-400" placeholder="Bobur Toshmatov" />
                </Field>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t.category} icon={<Wrench size={13} />} error={form.formState.errors.category?.message}>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c, locale) }))}
                        placeholder={tr(locale, "Kasbni tanlang", "Выберите профессию", "Choose your trade")}
                        invalid={!!form.formState.errors.category}
                      />
                    )}
                  />
                </Field>
                <Field label={t.basePrice} icon={<DollarSign size={13} />} error={form.formState.errors.basePrice?.message}>
                  <Input {...form.register("basePrice")} type="number" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 placeholder-slate-400" placeholder="50000" />
                </Field>
              </div>

              <Field label={t.services} error={form.formState.errors.services?.message}>
                <Input {...form.register("services")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 placeholder-slate-400" placeholder="Rozetka, Simi, Lampa" />
              </Field>

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

              {/* Master coordinate picker map */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Navigation size={13} className="text-blue-500 animate-pulse" /> {t.masterMapTitle}
                </Label>

                <div className="h-44 rounded-2xl w-full overflow-hidden relative border border-slate-200/50 dark:border-slate-800/40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <div id="master-map" className="w-full h-full rounded-2xl z-10" style={{ minHeight: "176px" }} />

                  {!leafletLoaded && (
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-400 font-semibold gap-2 animate-pulse z-20">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                      <span>{tr(locale, "Xarita yuklanmoqda...", "Карта загружается...", "Loading map...")}</span>
                    </div>
                  )}

                  {masterCoords && (
                    <div className="absolute bottom-2 left-2 bg-slate-950/75 text-[9px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none z-20">
                      <CheckCircle2 size={10} className="text-green-400 animate-pulse" />
                      <span>{t.masterMapHint}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label={t.bio}>
                <Textarea {...form.register("bio")} className="rounded-xl min-h-[90px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 placeholder-slate-400" placeholder="Tajribangiz va mahoratingiz haqida batafsil..." />
              </Field>

                            <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{cleanTabLabel(t.socialTab)}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 px-4 py-3.5 rounded-2xl leading-normal">
                {t.socialDesc}
              </p>
              <Field label="Telegram" icon={<MessageCircle size={13} />}>
                <Input {...form.register("telegram")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" placeholder="https://t.me/username" />
              </Field>
              <Field label="Instagram" icon={<Instagram size={13} />}>
                <Input {...form.register("instagram")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" placeholder="https://instagram.com/username" />
              </Field>
              <Field label={tr(locale, "Vebsayt", "Сайт", "Website")} icon={<Globe size={13} />}>
                <Input {...form.register("website")} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" placeholder="https://yourwebsite.uz" />
              </Field>
              </div>

              <SaveSection saved={saved} isSaving={isSaving} saveText={t.saveBtn} savedSuccessText={t.savedSuccess} />
            </motion.div>
          </TabsContent>
        </form>

        {/* REDESIGNED: Master Orders handling tab list */}
        <TabsContent value="orders">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-sm">{t.noOrders}</p>
              </div>
            ) : (
              orders.map((order, i) => {
                let distanceText = "—";
                let yandexRouteUrl = "";
                if (order.lat && order.lng && masterCoords) {
                  const dist = calculateDistance(masterCoords.lat, masterCoords.lng, order.lat, order.lng);
                  distanceText = `${dist.toFixed(1)} km`;
                  yandexRouteUrl = `https://yandex.ru/maps/?rtext=${masterCoords.lat},${masterCoords.lng}~${order.lat},${order.lng}&rtt=auto`;
                }

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900/60 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-[#F97316]/20 transition-all duration-300 w-full"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#F97316] dark:text-[#F97316]/90 font-extrabold uppercase tracking-widest block mb-1">
                          {t.orderProblem}
                        </span>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate">
                          {order.problem || "—"}
                        </h4>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={order.status} locale={locale} />
                      </div>
                    </div>

                    {/* Symmetrical Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 relative z-10 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      <p className="flex items-start gap-1.5 leading-normal min-w-0">
                        <MapPin size={13} className="text-[#F97316] shrink-0 mt-0.5" />
                        <span className="truncate">{order.address || "—"}</span>
                      </p>
                      <p className="flex items-center gap-1.5 leading-normal min-w-0">
                        <Phone size={13} className="text-blue-500 shrink-0" />
                        <span>{order.phone || "—"}</span>
                      </p>

                      {order.lat && order.lng && (
                        <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-extrabold text-[12px] bg-emerald-500/10 w-fit px-3 py-1 rounded-xl border border-emerald-500/10 shrink-0">
                          <NavigationIcon className="text-emerald-500 animate-spin-slow shrink-0" />
                          {t.orderDistance}: <span className="underline decoration-2 font-black">{distanceText}</span>
                        </p>
                      )}

                      {/* Display final price if order completed */}
                      {(order.status === "done" || order.status === "completed_by_master") && (
                        <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-extrabold text-[12px] bg-emerald-500/10 w-fit px-3 py-1 rounded-xl border border-emerald-500/10 shrink-0">
                          <DollarSign size={12} className="text-emerald-500 shrink-0" />
                          {tr(locale, "Narx: ", "Цена: ", "Price: ")}
                          <span className="font-black">{Number(order.finalPrice || order.masterConfirmedPrice || 0).toLocaleString()} UZS</span>
                        </p>
                      )}

                      {/* Cancellation Reason Display Banner */}
                      {order.status === "cancelled" && order.cancellationReason && (
                        <div className="col-span-1 sm:col-span-2 p-2.5 rounded-xl border border-red-500/15 bg-red-500/5 text-red-500 text-[11px] font-bold leading-normal flex items-start gap-1.5 mt-1">
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

                    {/* REDESIGNED Action Trays: Unbreakable layout wrapping cleanly */}
                    <div className="flex flex-wrap items-center gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60 relative z-10 w-full">
                      {order.userId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openOrderChat(order)}
                          className="h-10 rounded-xl px-3.5 text-xs font-extrabold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <MessageSquare size={12} className="text-[#F97316]" /> {tr(locale, "Chat", "Чат", "Chat")}
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <>
                          <a href={`tel:${order.phone}`} className="shrink-0">
                            <Button variant="outline" className="h-10 rounded-xl px-3.5 text-xs font-extrabold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <PhoneCall size={12} className="text-blue-500" /> {t.callBtn}
                            </Button>
                          </a>

                          {yandexRouteUrl && (
                            <a href={yandexRouteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <Button variant="outline" className="h-10 rounded-xl px-3.5 text-xs font-extrabold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-red-500 border-red-100 dark:border-red-950/20">
                                <MapPin size={12} className="text-red-500" /> {t.routeBtn}
                              </Button>
                            </a>
                          )}

                          <Button
                            onClick={() => setSelectedOrderForReport(order.id)}
                            variant="outline"
                            className="h-10 rounded-xl px-3.5 text-xs font-extrabold text-orange-500 border-orange-200 dark:border-orange-950/40 hover:bg-orange-50 dark:hover:bg-orange-950/20 gap-1.5 active:scale-[0.97] transition-all"
                          >
                            <AlertTriangle size={12} /> {t.reportBtn}
                          </Button>

                          <Button
                            onClick={() => setCancellingOrder(order)}
                            variant="outline"
                            className="h-10 rounded-xl px-3.5 text-xs font-extrabold text-red-500 border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 active:scale-[0.97] transition-all"
                          >
                            <XCircle size={12} /> {t.rejectBtn}
                          </Button>

                          <Button
                            onClick={() => handleAcceptOrder(order)}
                            className="h-10 rounded-xl px-4 text-xs font-extrabold text-white bg-green-500 hover:bg-green-600 gap-1.5 active:scale-[0.97] transition-all shadow-md shadow-green-500/10"
                          >
                            <CheckCircle2 size={12} /> {t.acceptBtn}
                          </Button>
                        </>
                      )}

                      {order.status === "accepted" && (
                        <>
                          <a href={`tel:${order.phone}`} className="shrink-0">
                            <Button variant="outline" className="h-10 rounded-xl px-3.5 text-xs font-extrabold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <PhoneCall size={12} className="text-blue-500" /> {t.callBtn}
                            </Button>
                          </a>

                          {yandexRouteUrl && (
                            <a href={yandexRouteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <Button variant="outline" className="h-10 rounded-xl px-3.5 text-xs font-extrabold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-red-500">
                                <MapPin size={12} className="text-red-500" /> {t.routeBtn}
                              </Button>
                            </a>
                          )}

                          <Button
                            onClick={() => setCancellingOrder(order)}
                            variant="outline"
                            className="h-10 rounded-xl px-3.5 text-xs font-extrabold text-red-500 border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 active:scale-[0.97] transition-all"
                          >
                            <XCircle size={12} /> {t.rejectBtn}
                          </Button>

                          <Button
                            onClick={() => setCompletingOrder(order)}
                            className="h-10 rounded-xl px-4.5 text-xs font-extrabold text-white bg-[#F97316] hover:bg-[#EA580C] gap-1.5 active:scale-[0.97] transition-all shadow-md shadow-orange-500/15"
                          >
                            <CheckCircle2 size={12} /> {t.doneBtn}
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </TabsContent>

        {/* 🛠️ [BETA] Interactive Weekly Schedule Settings */}
        <TabsContent value="schedule">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border border-orange-500/15">
              <Badge className="bg-[#F97316] text-white border-0 text-[9px] font-extrabold uppercase shrink-0">
                {t.betaTitle}
              </Badge>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {t.scheduleTitle} — {t.betaDesc}
              </p>
            </div>

            <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
              {t.scheduleDays.map((dayName: string, dIdx: number) => (
                <div key={dayName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/40 dark:border-slate-800/30 last:pb-0 last:border-b-0">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 w-24 shrink-0">{dayName}</span>
                  <div className="flex flex-wrap gap-2 flex-1 justify-start sm:justify-end">
                    {t.scheduleSlots.map((slotName: string, sIdx: number) => {
                      const isActive = (scheduleState[dIdx] || []).includes(sIdx);
                      return (
                        <motion.button
                          key={slotName}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleSlot(dIdx, sIdx, dayName, slotName)}
                          className={`text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl transition-all border ${
                            isActive
                              ? "bg-[#F97316] text-white border-[#F97316] shadow-sm shadow-orange-500/20 font-extrabold"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:border-[#F97316]/50"
                          }`}
                        >
                          {slotName}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* 📊 [BETA] Interactive Revenue Analytics Dashboard */}
        <TabsContent value="analytics">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#F97316] text-white border-0 text-[9px] font-extrabold uppercase shrink-0">
                  {t.betaTitle}
                </Badge>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t.analyticsTab} — {t.betaDesc}
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
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">{t.analyticsEarnings}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400">{currentPeriodData.earnings}</span>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-blue-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">{t.analyticsCompleted}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">{currentPeriodData.completed}</span>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-yellow-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">{t.analyticsPending}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">{currentPeriodData.pending}</span>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/15 rounded-3xl p-5 flex flex-col gap-1.5 shadow-sm hover:bg-purple-500/15 transition-all duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-wide text-slate-500 dark:text-slate-400">{t.analyticsRating}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">{currentPeriodData.rating}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Premium Symmetrical Grid Trend Chart */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner space-y-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-355 block uppercase tracking-wider">{t.trendTitle}</span>

              <div className="h-32 flex items-end justify-between gap-2.5 px-3 pt-6 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-0 top-6 border-t border-slate-200/40 dark:border-slate-800/40 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 border-t border-slate-200/40 dark:border-slate-800/40 pointer-events-none" />

                {currentPeriodData.trends.map((val, idx) => {
                  const max = Math.max(...currentPeriodData.trends) || 1;
                  const heightPct = Math.max(8, (val / max) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Bar hover tooltip */}
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950 text-white text-[8px] font-bold px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-20">
                        {val.toLocaleString()} UZS
                      </div>

                      {/* Animated Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15, delay: idx * 0.05 }}
                        className={`w-full max-w-[24px] rounded-t-lg bg-gradient-to-t transition-all duration-300 shadow-sm ${
                          val > 0
                            ? "from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 shadow-orange-500/10"
                            : "from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 opacity-30"
                        }`}
                      />

                      <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-1">
                        {currentPeriodData.labels[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ⭐ [BETA] Interactive Client Reviews Tab */}
        <TabsContent value="reviews">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border border-orange-500/15">
              <Badge className="bg-[#F97316] text-white border-0 text-[9px] font-extrabold uppercase shrink-0">
                {t.betaTitle}
              </Badge>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {t.reviewsTab} — {t.betaDesc}
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

              {/* Sorting buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSortReviews("newest")} className="rounded-lg h-9 text-[10px] font-bold">
                  {tr(locale, "Eng yangi", "Сначала новые", "Newest first")}
                </Button>
                <Button variant="outline" onClick={() => handleSortReviews("rating")} className="rounded-lg h-9 text-[10px] font-bold">
                  {tr(locale, "Reyting", "По рейтингу", "By rating")}
                </Button>
                {/* Rating filter toggle */}
                <CustomSelect
                  value={selectedRatingFilter === null ? "all" : String(selectedRatingFilter)}
                  onChange={(v) => setSelectedRatingFilter(v === "all" ? null : Number(v))}
                  options={[
                    { value: "all", label: tr(locale, "Barcha yulduzlar", "Все звезды", "All stars") },
                    { value: "5", label: "5 ⭐" },
                    { value: "4", label: "4 ⭐" },
                  ]}
                  className="h-9 w-auto min-w-[9rem] rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/40">
                  <Star size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {tr(locale, "Hozircha sharhlar yo'q", "Пока нет отзывов", "No reviews yet")}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                    {tr(locale, "Birinchi ishni yakunlagach, mijozlar sizga baho va sharh qoldiradi.", "После первого выполненного заказа клиенты оставят вам оценку и отзыв.", "After your first completed job, clients will leave you a rating and review.")}
                  </p>
                </div>
              ) : (
                filteredReviews.map((rev) => (
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

                    {/* Replies listing */}
                    {rev.replies.map((reply, rIdx) => (
                      <motion.div
                        key={rIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 ml-5 flex flex-col gap-1 shadow-sm"
                      >
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">{tr(locale, "Sizning javobingiz", "Ваш ответ", "Your reply")}</span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-normal">{reply}</p>
                        <Badge className="bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/10 border-0 text-[8px] font-extrabold uppercase py-0 px-2 w-fit">
                          {t.replyBetaBadge}
                        </Badge>
                      </motion.div>
                    ))}

                    {/* Interactive Reply Input form */}
                    <div className="mt-1 flex flex-col gap-2">
                      {!replyInputOpen[rev.id] ? (
                        <Button
                          variant="ghost"
                          onClick={() => setReplyInputOpen(prev => ({ ...prev, [rev.id]: true }))}
                          className="h-8 w-fit text-[10px] font-bold text-slate-500 hover:text-[#F97316] gap-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MessageSquare size={11} /> {t.replyBtn}
                        </Button>
                      ) : (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-1 ml-5">
                          <textarea
                            value={replyTextMap[rev.id] || ""}
                            onChange={(e) => setReplyTextMap(prev => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder={t.replyPlaceholder}
                            className="w-full h-16 p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#F97316] text-xs dark:text-white resize-none"
                          ></textarea>

                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              onClick={() => setReplyInputOpen(prev => ({ ...prev, [rev.id]: false }))}
                              className="h-8 rounded-lg text-[10px] font-bold"
                            >
                              {tr(locale, "Bekor qilish", "Отмена", "Cancel")}
                            </Button>

                            <Button
                              onClick={() => handleAddReply(rev.id)}
                              disabled={!(replyTextMap[rev.id] || "").trim()}
                              className="bg-[#F97316] hover:bg-[#EA580C] text-white h-8 rounded-lg text-[10px] font-extrabold px-3 active:scale-[0.97]"
                            >
                              {t.replySubmit}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ─── Complaint Reason Dialog Modal [BETA] ──────────────────────────────── */}
      <Dialog open={selectedOrderForReport !== null} onOpenChange={() => setSelectedOrderForReport(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-55">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
              <AlertTriangle className="text-orange-500 animate-pulse" size={20} />
              {t.reportModalTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              Shikoyat sababini kiriting. U platforma moderatsiyasi tomonidan tekshiriladi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t.reportModalPlaceholder}
              className="w-full h-24 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/55 focus:border-[#F97316] text-xs sm:text-sm dark:text-white resize-none"
            ></textarea>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => { setSelectedOrderForReport(null); setReportReason(""); }}
              variant="outline"
              className="rounded-xl px-4 font-bold text-xs"
            >
              {t.reportCancel}
            </Button>
            <Button
              onClick={handleSendReport}
              disabled={!reportReason.trim()}
              className="bg-orange-500 hover:bg-orange-650 text-white rounded-xl px-5 font-bold text-xs shadow-md shadow-orange-500/10 active:scale-[0.97]"
            >
              {t.reportModalSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Reason Dialog Modal ────────────────────────────────────────── */}
      <CancelReasonModal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onConfirm={handleRejectConfirm}
        locale={locale}
      />

      {/* ─── Reciprocal Review Completion Modal ────────────────────────────────── */}
      <ReviewConfirmModal
        isOpen={!!completingOrder}
        onClose={() => setCompletingOrder(null)}
        onConfirm={handleCompleteConfirm}
        locale={locale}
        mode="master"
        partnerName={completingOrder?.phone || tr(locale, "Mijoz", "Клиент", "Client")}
        basePrice={profile?.basePrice || 10000}
      />
    </>
  );
}
