"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { Bell, BellRing, Check, Eye, Calendar, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

/** Short two-tone chime (no audio file needed). Silently ignored if the browser blocks audio. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore */
  }
}

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  orderId: string;
  status: string;
  read: boolean;
  createdAt: any;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "archive">("new");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initialized = useRef(false);
  const [toast, setToast] = useState<{ title: string; message: string; status: string } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    // Reading the browser permission once on mount (it is not available during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const enableBrowserAlerts = async () => {
    if (typeof Notification === "undefined") return;
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      /* ignore */
    }
  };

  // Ask once, on the first click after sign-in (browsers only allow this from a user gesture).
  useEffect(() => {
    if (!user || typeof Notification === "undefined" || Notification.permission !== "default") return;
    if (sessionStorage.getItem("epchil_asked_notif")) return;
    const ask = () => {
      sessionStorage.setItem("epchil_asked_notif", "1");
      Notification.requestPermission().then(setPermission).catch(() => {});
    };
    window.addEventListener("click", ask, { once: true });
    return () => window.removeEventListener("click", ask);
  }, [user]);

  // In-app toast + OS notification for notifications that arrive while the site is open.
  const announce = (title: string, message: string, status: string) => {
    setToast({ title, message, status });
    playChime();
    setTimeout(() => setToast((cur) => (cur && cur.title === title && cur.message === message ? null : cur)), 7000);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const n = new Notification(title, { body: message, icon: "/favicon.ico", tag: `epchil-${status}` });
        n.onclick = () => {
          window.focus();
          router.push(status === "message" ? "/messages" : "/profile");
          n.close();
        };
      } catch {
        /* some browsers only allow notifications from a service worker */
      }
    }
  };

  const t = {
    uz: {
      bellTitle: "Bildirishnomalar",
      tabNew: "Yangi",
      tabArchive: "Arxiv",
      markAll: "Hammasini o'qildi qilish",
      noNew: "Yangi bildirishnomalar yo'q",
      noArchive: "Arxiv bo'sh",
      clearAll: "Tozalash",
      statusStepTitle: "Buyurtma jarayoni:"
    },
    ru: {
      bellTitle: "Уведомления",
      tabNew: "Новые",
      tabArchive: "Архив",
      markAll: "Отметить все как прочитанные",
      noNew: "Нет новых уведомлений",
      noArchive: "Архив пуст",
      clearAll: "Очистить",
      statusStepTitle: "Прогресс заказа:"
    },
    en: {
      bellTitle: "Notifications",
      tabNew: "New",
      tabArchive: "Archive",
      markAll: "Mark all as read",
      noNew: "No new notifications",
      noArchive: "The archive is empty",
      clearAll: "Clear",
      statusStepTitle: "Order progress:"
    },
  }[locale as "uz" | "ru" | "en"] || {
    bellTitle: "Notifications",
    tabNew: "New",
    tabArchive: "Archive",
    markAll: "Mark all read",
    noNew: "No new notifications",
    noArchive: "Archive empty",
    clearAll: "Clear",
    statusStepTitle: "Order Progress:"
  };

  // Real-time listener for notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    initialized.current = false;
    const unsubscribe = onSnapshot(q, (snap) => {
      // Announce only what arrives after the first snapshot (not the existing backlog).
      if (initialized.current && !snap.metadata.fromCache) {
        snap.docChanges().forEach((change) => {
          const n = change.doc.data();
          if (change.type === "added" && !n.read) announce(String(n.title ?? ""), String(n.message ?? ""), String(n.status ?? ""));
        });
      }
      initialized.current = true;
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
      // Sort locally by createdAt desc to avoid composite index requirement
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      setNotifications(list.slice(0, 20));
    }, (err) => {
      console.error("Notifications snapshot error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const newNotifications = notifications.filter((n) => !n.read);
  const archiveNotifications = notifications.filter((n) => n.read);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (newNotifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      newNotifications.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return tr(locale, "Hozirgincha", "Только что", "Just now");
      if (diffMins < 60) return tr(locale, `${diffMins} daqiqa oldin`, `${diffMins} мин. назад`, `${diffMins} min ago`);
      if (diffHours < 24) return tr(locale, `${diffHours} soat oldin`, `${diffHours} ч. назад`, `${diffHours} h ago`);
      return tr(locale, `${diffDays} kun oldin`, `${diffDays} дн. назад`, `${diffDays} d ago`);
    } catch {
      return "";
    }
  };

  // Renders a visual progress flow indicator for the linked order status
  const renderStepProgress = (status: string) => {
    const steps = [
      { key: "pending", uz: "Kutilmoqda", ru: "Ожидает", en: "Pending" },
      { key: "accepted", uz: "Qabul qilindi", ru: "Принят", en: "Accepted" },
      { key: "completed_by_master", uz: "Bitirildi", ru: "Завершен", en: "Finished" },
      { key: "done", uz: "Yakunlandi", ru: "Выполнен", en: "Done" }
    ];

    let activeIdx = 0;
    if (status === "accepted") activeIdx = 1;
    if (status === "completed_by_master") activeIdx = 2;
    if (status === "done") activeIdx = 3;

    return (
      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/30 dark:border-slate-800/40 rounded-xl">
        <p className="text-[9px] font-extrabold uppercase text-[#F97316] mb-1.5 flex items-center gap-1 tracking-wider">
          <Sparkles size={9} className="animate-spin-slow" />
          {t.statusStepTitle}
        </p>
        <div className="flex items-center justify-between w-full gap-1">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIdx;
            const isCurrent = idx === activeIdx;

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {/* Connecting line */}
                {idx > 0 && (
                  <div className={`absolute right-1/2 top-2 -translate-y-1/2 w-full h-[2px] -z-10 ${
                    isCompleted ? "bg-[#F97316]" : "bg-slate-200 dark:bg-slate-800"
                  }`} style={{ right: "50%", width: "100%" }} />
                )}
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${
                  isCurrent
                    ? "bg-[#F97316] text-white border-[#F97316] shadow-sm animate-pulse"
                    : isCompleted
                    ? "bg-orange-500/20 text-[#F97316] border-[#F97316]/40"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                }`}>
                  {isCompleted ? <Check size={8} strokeWidth={3} /> : idx + 1}
                </div>
                <span className={`text-[8px] font-bold mt-1 text-center truncate w-full ${
                  isCurrent ? "text-slate-950 dark:text-white" : "text-slate-400"
                }`}>
                  {step[locale]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Live toast for freshly arrived notifications */}
      <AnimatePresence>
        {toast && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            onClick={() => {
              router.push(toast.status === "message" ? "/messages" : "/profile");
              setToast(null);
            }}
            className="fixed inset-x-3 top-20 z-[9999] flex items-start gap-3 rounded-2xl border border-[#F97316]/30 bg-white p-4 text-left shadow-2xl shadow-orange-500/10 dark:bg-slate-900 sm:inset-x-auto sm:right-6 sm:w-96"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
              <BellRing size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-white">{toast.title}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs font-medium text-slate-600 dark:text-slate-300">{toast.message}</span>
            </span>
            <span
              role="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={16} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bell Button Icon Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-350 relative hover:border-[#F97316]/30 transition-all duration-200"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-swing" : ""} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-md shadow-red-500/20"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Flyout Glassmorphic Drawer Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-90 max-h-[480px] overflow-hidden rounded-[2rem] bg-white/95 dark:bg-slate-950/95 text-slate-950 dark:text-white backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xl flex flex-col z-[9999]"
          >
            {/* Header */}
            <div className="p-4.5 border-b border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.bellTitle}
                </h4>
              </div>
              {newNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-extrabold text-[#F97316] hover:underline flex items-center gap-1 uppercase tracking-wide"
                >
                  <Check size={11} strokeWidth={2.5} />
                  {t.markAll}
                </button>
              )}
            </div>

            {permission === "default" && (
              <button
                type="button"
                onClick={enableBrowserAlerts}
                className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-[#F97316]/10 px-3 py-2 text-left text-[11px] font-bold text-[#C2570C] transition-colors hover:bg-[#F97316]/20 dark:text-orange-300"
              >
                <BellRing size={14} className="shrink-0" />
                {tr(locale, "Brauzer bildirishnomalarini yoqish", "Включить уведомления браузера", "Enable browser notifications")}
              </button>
            )}

            {/* Tabs Trigger list */}
            <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 mx-4.5 mt-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
              <button
                onClick={() => setActiveTab("new")}
                className={`flex-1 text-[11px] font-extrabold py-2 rounded-lg transition-all ${
                  activeTab === "new"
                    ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm font-black"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {t.tabNew} ({newNotifications.length})
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`flex-1 text-[11px] font-extrabold py-2 rounded-lg transition-all ${
                  activeTab === "archive"
                    ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm font-black"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {t.tabArchive} ({archiveNotifications.length})
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-4.5 max-h-[300px] min-h-[160px] space-y-3">
              <AnimatePresence mode="wait">
                {(activeTab === "new" ? newNotifications : archiveNotifications).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500 gap-2"
                  >
                    <Bell size={28} className="opacity-20 mb-1" />
                    <p className="text-xs font-bold font-mono uppercase tracking-wide">
                      {activeTab === "new" ? t.noNew : t.noArchive}
                    </p>
                  </motion.div>
                ) : (
                  (activeTab === "new" ? newNotifications : archiveNotifications).map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                        notif.read
                          ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900"
                          : "bg-orange-500/5 dark:bg-[#F97316]/5 border-[#F97316]/10 hover:bg-[#F97316]/10"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                            {notif.title}
                          </h5>
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-350 leading-relaxed mt-1">
                            {notif.message}
                          </p>
                        </div>

                        {/* Eye mark read indicator */}
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-slate-400 hover:text-[#F97316] shrink-0 transition-colors pt-0.5 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                      </div>

                      {/* Render Order Milestones Steps Progress */}
                      {notif.status && notif.status !== "message" && renderStepProgress(notif.status)}

                      <div className="flex items-center gap-1 mt-2 text-[9px] text-slate-400 font-bold justify-end">
                        <Calendar size={10} />
                        <span>{formatTime(notif.createdAt)}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
