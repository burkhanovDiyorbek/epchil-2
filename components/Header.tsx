"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bolt, User, LogOut, Search, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage, tr } from "@/components/language-provider";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChats";
import { AuthModal } from "@/components/auth/AuthModal";
import { NotificationDropdown } from "@/components/profile/NotificationDropdown";

const navLink =
  "relative inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#F97316] dark:text-slate-300 dark:hover:bg-slate-800 md:px-3";

export function Header() {
  const { locale } = useLanguage();
  const { user, profile, isAdmin } = useAuth();
  const { unreadCount } = useChats(user?.uid);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Lets other pages (e.g. the "join as a master" CTA) open the sign-in modal.
  useEffect(() => {
    const open = () => setIsAuthModalOpen(true);
    window.addEventListener("epchil:open-auth", open);
    return () => window.removeEventListener("epchil:open-auth", open);
  }, []);

  const displayName = profile?.name || user?.email?.split("@")[0] || null;
  const signInLabel = tr(locale, "Kirish", "Войти", "Sign in");
  const signOutLabel = tr(locale, "Chiqish", "Выйти", "Sign out");
  const profileLabel = tr(locale, "Profil", "Профиль", "Profile");
  const bookLabel = tr(locale, "Usta chaqirish", "Вызвать мастера", "Book a master");
  const messagesLabel = tr(locale, "Xabarlar", "Сообщения", "Messages");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-xl sm:text-2xl font-bold text-[#1A365D] dark:text-blue-200">
            <div className="bg-gradient-to-br from-[#F97316] to-orange-500 text-white p-1.5 rounded-xl shadow-lg shadow-orange-500/20">
              <Bolt size={22} />
            </div>
            Epchil
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/booking" aria-label={bookLabel} className={navLink}>
              <Search size={18} />
              <span className="hidden lg:inline">{bookLabel}</span>
            </Link>

            {isAdmin && (
              <Link href="/admin" aria-label="Admin" className={navLink}>
                <ShieldCheck size={18} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            {user && (
              <Link href="/messages" aria-label={messagesLabel} className={navLink}>
                <MessageSquare size={18} />
                <span className="hidden lg:inline">{messagesLabel}</span>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#F97316] px-1 text-[10px] font-extrabold text-white dark:border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <ThemeToggle />
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationDropdown />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/profile" aria-label={profileLabel}>
                    <Button variant="outline" className="h-10 rounded-xl px-2.5 sm:px-4 font-semibold border-slate-200 dark:border-slate-800 gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold">
                        {(displayName?.[0] || "U").toUpperCase()}
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate text-slate-700 dark:text-slate-300">
                        {displayName || profileLabel}
                      </span>
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => signOut(auth)}
                    variant="ghost"
                    aria-label={signOutLabel}
                    className="h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium px-2.5 sm:px-3 gap-1.5"
                  >
                    <LogOut size={16} className="sm:hidden" />
                    <span className="hidden sm:inline">{signOutLabel}</span>
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-3 sm:px-5 font-semibold shadow-md gap-2"
                >
                  <User size={15} /> {signInLabel}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
