"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Master } from "./MasterCard";
import { CheckCircle2, Loader2, MapPin, Sparkles, Navigation } from "lucide-react";
import { useLanguage, tr } from "@/components/language-provider";
import { formatUzPhone } from "@/lib/phone-mask";
import { sendNotification } from "@/components/profile/notifications";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  master: Master | null;
  defaultProblem?: string;
}

export function BookingModal({ isOpen, onClose, master, defaultProblem = "" }: BookingModalProps) {
  const { locale } = useLanguage();
  const { profile } = useAuth();
  const [step, setStep] = useState<"form" | "success">("form");
  const [address, setAddress] = useState("");
  const [problem, setProblem] = useState(defaultProblem);
  const [phone, setPhone] = useState("");

  // Geolocation states (default to Tashkent center)
  const [lat, setLat] = useState(41.311081);
  const [lng, setLng] = useState(69.240562);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSelectedMap, setHasSelectedMap] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Leaflet integration states and refs
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const t = {
    uz: {
      title: "Buyurtma berish",
      sub: "Muammoingiz, manzilingiz va aloqa telefoningizni to'ldiring.",
      phoneLabel: "Bog'lanish uchun telefon raqami",
      addressLabel: "Manzilingiz (Tuman, ko'cha, uy)",
      problemLabel: "Muammo izohi (Batafsil)",
      gpsBtn: "Mening joylashuvim",
      gpsLoading: "Koordinatalar olinmoqda...",
      gpsMapHint: "Xaritadan joylashuv tasdiqlandi",
      submitBtn: "Tasdiqlash va Yuborish",
      successTitle: "Muvaffaqiyatli qabul qilindi!",
      successDesc: "Usta tez orada siz bilan bog'lanadi. Iltimos telefoningizni yoniq holda saqlang.",
      validationError: "Iltimos, barcha maydonlarni to'g'ri kiriting",
      loginError: "Iltimos, tizimga kiring",
      dbError: "Buyurtma berishda tizimli xatolik",
      mapRequiredError: "Iltimos, xaritadan buyurtma manzilini tanlang!",
    },
    ru: {
      title: "Оформить заказ",
      sub: "Опишите проблему, укажите адрес и контактный номер телефона.",
      phoneLabel: "Номер телефона для связи",
      addressLabel: "Ваш адрес (Район, улица, дом)",
      problemLabel: "Описание проблемы (Подробно)",
      gpsBtn: "Мое положение",
      gpsLoading: "Определяем координаты...",
      gpsMapHint: "Местоположение подтверждено на карте",
      submitBtn: "Подтвердить и Отправить",
      successTitle: "Успешно оформлено!",
      successDesc: "Мастер свяжется с вами в ближайшее время. Пожалуйста, держите телефон включенным.",
      validationError: "Пожалуйста, заполните все поля корректно",
      loginError: "Пожалуйста, войдите в систему",
      dbError: "Системная ошибка при оформлении заказа",
      mapRequiredError: "Пожалуйста, выберите адрес на карте!",
    },
    en: {
      title: "Place an order",
      sub: "Describe the problem, enter your address and contact phone.",
      phoneLabel: "Contact phone number",
      addressLabel: "Your address (district, street, house)",
      problemLabel: "Problem description (in detail)",
      gpsBtn: "My location",
      gpsLoading: "Getting coordinates...",
      gpsMapHint: "Location confirmed on the map",
      submitBtn: "Confirm and send",
      successTitle: "Order received!",
      successDesc: "The master will contact you shortly. Please keep your phone on.",
      validationError: "Please fill in all fields correctly",
      loginError: "Please sign in",
      dbError: "System error while placing the order",
      mapRequiredError: "Please choose the order address on the map!",
    },
  }[locale as "uz" | "ru" | "en"] || {
    title: "Buyurtma berish",
    sub: "Muammoingiz, manzilingiz va aloqa telefoningizni to'ldiring.",
    phoneLabel: "Bog'lanish uchun telefon raqami",
    addressLabel: "Manzilingiz (Tuman, ko'cha, uy)",
    problemLabel: "Muammo izohi (Batafsil)",
    gpsBtn: "Mening joylashuvim",
    gpsLoading: "Koordinatalar olinmoqda...",
    gpsMapHint: "Xaritadan joylashuv tasdiqlandi",
    submitBtn: "Tasdiqlash va Yuborish",
    successTitle: "Muvaffaqiyatli qabul qilindi!",
    successDesc: "Usta tez orada siz bilan bog'lanadi. Iltimos telefoningizni yoniq holda saqlang.",
    validationError: "Iltimos, barcha maydonlarni to'g'ri kiriting",
    loginError: "Iltimos, tizimga kiring",
    dbError: "Buyurtma berishda tizimli xatolik",
    mapRequiredError: "Iltimos, xaritadan buyurtma manzilini tanlang!",
  };

  // Dynamically load Leaflet CDN assets when modal opens
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setAddress("");
      setProblem(defaultProblem);
      setPhone("");
      setError("");
      setLat(41.311081);
      setLng(69.240562);
      setHasSelectedMap(false);
    }
  }, [isOpen, defaultProblem]);

  // Leaflet Map Initialization and Pin Updates
  useEffect(() => {
    if (!leafletLoaded || !isOpen || step !== "form") return;

    const L = (window as any).L;
    if (!L) return;

    // Wait for the DOM element booking-map to be mounted
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById("booking-map");
      if (!mapContainer) return;

      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        return;
      }

      // Create Leaflet Map instance
      const map = L.map("booking-map", {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 15);

      mapRef.current = map;

      // Add Zoom Control at custom position
      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // Symmetrical and pretty pulsing circular marker icon using HTML/CSS
      const customIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-bounce">
                 <div class="w-3.5 h-3.5 bg-white rounded-full shadow-inner"></div>
               </div>`,
        className: "booking-map-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      // Pin drag updates
      marker.on("dragend", async (e: any) => {
        const pos = e.target.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        setHasSelectedMap(true);
        await reverseGeocode(pos.lat, pos.lng);
      });

      // Map click updates
      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setLat(clickLat);
        setLng(clickLng);
        setHasSelectedMap(true);
        marker.setLatLng([clickLat, clickLng]);
        await reverseGeocode(clickLat, clickLng);
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
  }, [leafletLoaded, isOpen, step]);

  // Reverse Geocoding helper
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data && data.display_name) {
        // Strip down the address to keep it readable and not too verbose
        const parts = data.display_name.split(",");
        const shortAddress = parts.slice(0, 4).join(",").trim();
        setAddress(shortAddress || data.display_name);
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (e) {
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  // GPS orqali joylashuvni olish va teskari geokodlash
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError(tr(locale, "GPS qo'llab-quvvatlanmaydi", "GPS не поддерживается", "GPS is not supported"));
      return;
    }

    setIsLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setHasSelectedMap(true);
        setIsLocating(false);

        // Update map view & marker position instantly
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }

        await reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsLocating(false);
        setError(tr(locale, "GPS ruxsati berilmagan yoki xatolik yuz berdi", "Доступ к GPS отклонен или произошла ошибка", "GPS permission denied or an error occurred"));
      },
      { timeout: 7000 }
    );
  };

  const submitOrder = async () => {
    // A fully formed Uzbek number under the mask has 12 digits: 998 + 9 digits local number
    const cleanPhone = phone.replace(/\D/g, "");
    if (!address.trim() || !problem.trim() || cleanPhone.length < 12) {
      setError(t.validationError);
      return;
    }

    if (!hasSelectedMap) {
      setError(t.mapRequiredError);
      return;
    }

    if (!master) return;

    setError("");
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError(t.loginError);
        window.dispatchEvent(new Event("epchil:open-auth"));
        return;
      }

      // Buyurtmani Firestorega koordinatalari hamda usta tafsilotlari bilan saqlaymiz!
      const docRef = await addDoc(collection(db, "orders"), {
        masterId: master.id,
        masterName: `${master.firstName} ${master.lastName}`,
        masterCategory: master.category,
        masterPhone: master.phone,
        userId: user.uid,
        userName: profile?.name || user.displayName || user.email?.split("@")[0] || "",
        phone,
        address,
        problem,
        lat,
        lng,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Send Firestore notification immediately to master
      try {
        const clientName = user.displayName || tr(locale, "Mijoz", "Клиент", "Client");
        const title = tr(locale, "Yangi buyurtma!", "Новый заказ!", "New order!");
        const msg = tr(
          locale,
          `${clientName} sizga yangi buyurtma yubordi.`,
          `${clientName} отправил вам новый заказ.`,
          `${clientName} sent you a new order.`
        );

        await sendNotification(master.id, title, msg, docRef.id, "pending");
      } catch (notifyErr) {
        console.error("Failed to send notification inside BookingModal:", notifyErr);
      }

      setStep("success");

      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Submit order error:", err);
      setError(t.dbError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl z-[9999]">
        <div className="p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Sparkles className="text-[#F97316] animate-pulse" size={22} />
              {t.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-normal font-semibold">
              {t.sub}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div
                  key="form-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4"
                >
                  {/* Phone input with dialing mask */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      {t.phoneLabel}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                      placeholder="+998 (90) 123-45-67"
                      className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-4 focus:ring-2 focus:ring-[#F97316]/55 focus:border-[#F97316] outline-none transition-all dark:text-white text-sm"
                    />
                  </div>

                  {/* Geolocation Trigger & Interactive Map */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                        {t.addressLabel}
                      </label>

                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-xs text-[#F97316] hover:text-[#EA580C] font-bold flex items-center gap-1 bg-orange-500/10 px-2.5 py-1.5 rounded-xl border border-orange-500/10 active:scale-[0.97] transition-all"
                      >
                        {isLocating ? (
                          <><Loader2 className="animate-spin" size={12} /> {t.gpsLoading}</>
                        ) : (
                          <><Navigation size={12} className="fill-[#F97316] text-[#F97316]" /> {t.gpsBtn}</>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masalan: Chilonzor 20-kvartal, 14-uy"
                      className="w-full h-14 resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 focus:ring-2 focus:ring-[#F97316]/55 focus:border-[#F97316] outline-none transition-all dark:text-white text-sm"
                    ></textarea>

                    {/* Interactive Leaflet Map picker */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={11} className="text-[#F97316]" />
                        <span>{tr(locale, "Xaritani bosib yoki pinni surib aniq nuqtani tanlang:", "Нажмите на карту или перетащите пин:", "Click the map or drag the pin to choose the exact spot:")}</span>
                      </div>

                      <div className="h-44 rounded-2xl bg-slate-50 dark:bg-slate-900 w-full overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center">
                        <div id="booking-map" className="w-full h-full rounded-2xl z-10" style={{ minHeight: "176px" }} />

                        {!leafletLoaded && (
                          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-400 font-semibold gap-2 animate-pulse z-20">
                            <Loader2 className="animate-spin text-[#F97316]" size={20} />
                            <span>{tr(locale, "Xarita yuklanmoqda...", "Карта загружается...", "Loading map...")}</span>
                          </div>
                        )}

                        {hasSelectedMap && (
                          <div className="absolute bottom-2 left-2 bg-slate-950/75 text-[9px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none z-20">
                            <CheckCircle2 size={10} className="text-green-400" />
                            <span>{t.gpsMapHint}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Problem details */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      {t.problemLabel}
                    </label>
                    <textarea
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Nima muammo borligini qisqacha yozing..."
                      className="w-full h-16 resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 focus:ring-2 focus:ring-[#F97316]/55 focus:border-[#F97316] outline-none transition-all dark:text-white text-sm"
                    ></textarea>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/15 flex items-center gap-1.5">
                      <Sparkles size={12} /> {error}
                    </p>
                  )}

                  <Button
                    onClick={submitOrder}
                    disabled={isLoading}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#1A365D] to-[#F97316] text-white font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all text-sm"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : t.submitBtn}
                  </Button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success-container"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-500/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="text-green-500" size={40} />
                  </motion.div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t.successTitle}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                    {t.successDesc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
