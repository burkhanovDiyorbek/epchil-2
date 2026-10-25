"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useLanguage, tr, pick } from "@/components/language-provider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dict = {
  uz: {
    loginTitle: "Tizimga Kirish",
    registerTitle: "Ro'yxatdan O'tish",
    loginSub: "Xush kelibsiz! Tizimga kirish uchun quyidagi ma'lumotlarni to'ldiring.",
    registerSub: "Yangi hisob yarating va Epchil platformasidan to'liq foydalaning.",
    emailLabel: "Elektron pochta (Email)",
    passwordLabel: "Parol (kamida 6 belgi)",
    emailPlaceholder: "email@example.com",
    passwordPlaceholder: "******",
    loginBtn: "Kirish",
    registerBtn: "Ro'yxatdan o'tish",
    orText: "Yoki",
    googleBtn: "Google orqali kirish",
    noAccount: "Hisobingiz yo'qmi? Ro'yxatdan o'ting →",
    hasAccount: "Hisobingiz bormi? Kiring →",
    errorRequired: "Email va parolni to'g'ri kiriting!",
    errorPasswordLength: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    successLogin: "Tizimga muvaffaqiyatli kirdingiz!",
    successRegister: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
    successGoogle: "Google orqali tizimga kirdingiz!",
    errorEmailInUse: "Bu email band. Iltimos login qiling.",
    errorInvalidCred: "Email yoki parol noto'g'ri.",
    errorTooMany: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring.",
    successState: "Muvaffaqiyatli! Profil tekshirilmoqda...",
  },
  ru: {
    loginTitle: "Вход в систему",
    registerTitle: "Регистрация",
    loginSub: "Добро пожаловать! Заполните форму ниже для входа в систему.",
    registerSub: "Создайте аккаунт и используйте все возможности платформы Epchil.",
    emailLabel: "Электронная почта (Email)",
    passwordLabel: "Пароль (минимум 6 символов)",
    emailPlaceholder: "email@example.com",
    passwordPlaceholder: "******",
    loginBtn: "Войти",
    registerBtn: "Зарегистрироваться",
    orText: "Или",
    googleBtn: "Войти через Google",
    noAccount: "Нет аккаунта? Зарегистрируйтесь →",
    hasAccount: "Уже есть аккаунт? Войдите →",
    errorRequired: "Пожалуйста, заполните email и пароль!",
    errorPasswordLength: "Пароль должен содержать минимум 6 символов!",
    successLogin: "Вы успешно вошли в систему!",
    successRegister: "Вы успешно зарегистрировались!",
    successGoogle: "Вы успешно вошли через Google!",
    errorEmailInUse: "Этот email уже занят. Пожалуйста, войдите.",
    errorInvalidCred: "Неверный email или пароль.",
    errorTooMany: "Слишком много попыток. Пожалуйста, попробуйте позже.",
    successState: "Успешно! Проверка профиля...",
  },
  en: {
    loginTitle: "Sign in",
    registerTitle: "Create account",
    loginSub: "Welcome back! Fill in the details below to sign in.",
    registerSub: "Create a new account and get the full Epchil experience.",
    emailLabel: "Email",
    passwordLabel: "Password (at least 6 characters)",
    emailPlaceholder: "email@example.com",
    passwordPlaceholder: "******",
    loginBtn: "Sign in",
    registerBtn: "Create account",
    orText: "Or",
    googleBtn: "Continue with Google",
    noAccount: "No account yet? Sign up →",
    hasAccount: "Already have an account? Sign in →",
    errorRequired: "Please enter a valid email and password!",
    errorPasswordLength: "Password must be at least 6 characters!",
    successLogin: "You are signed in!",
    successRegister: "Your account has been created!",
    successGoogle: "Signed in with Google!",
    errorEmailInUse: "This email is already in use. Please sign in.",
    errorInvalidCred: "Incorrect email or password.",
    errorTooMany: "Too many attempts. Please try again later.",
    successState: "Success! Checking your profile...",
  },
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = pick(locale, dict);

  const [step, setStep] = useState<"form" | "success">("form");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setEmail("");
      setPassword("");
      setIsLoginMode(true);
      setToast(null);
    }
  }, [isOpen]);

  const handleAuthSuccess = async (user: any, isNewUser: boolean) => {
    setStep("success");
    setIsLoading(false);

    // Firestore foydalanuvchi ma'lumotlarini sinxronlashtirish
    const firestoreTask = (async () => {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split("@")[0] || "",
        createdAt: serverTimestamp(),
      }, { merge: true }).catch(err => console.warn("Firestore sync error:", err.message));

      if (isNewUser) {
        return false; // yangi foydalanuvchida rol bo'lmaydi
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        return snap.exists() && !!snap.data()?.role;
      } catch {
        return false;
      }
    })();

    // Animatsiya vaqti va Firestore so'rovini kutish
    const [_, hasRole] = await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 1400)),
      firestoreTask
    ]);

    onClose();
    if (!hasRole) {
      router.push("/onboarding");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      showToast(password.length < 6 ? t.errorPasswordLength : t.errorRequired, "error");
      return;
    }
    setIsLoading(true);

    try {
      let credential;
      if (isLoginMode) {
        credential = await signInWithEmailAndPassword(auth, email, password);
        showToast(t.successLogin, "success");
      } else {
        credential = await createUserWithEmailAndPassword(auth, email, password);
        showToast(t.successRegister, "success");
      }

      await handleAuthSuccess(credential.user, !isLoginMode);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      if (err.code === "auth/email-already-in-use") {
        showToast(t.errorEmailInUse, "error");
      } else if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(err.code)) {
        showToast(t.errorInvalidCred, "error");
      } else if (err.code === "auth/too-many-requests") {
        showToast(t.errorTooMany, "error");
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(auth, provider);
      showToast(t.successGoogle, "success");
      // Google user yangi yoki yo'qligini tekshirish uchun metadata'dan foydalanamiz
      const isNewUser = credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime;
      await handleAuthSuccess(credential.user, isNewUser);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      if (err.code === "auth/popup-closed-by-user") {
        showToast(tr(locale, "Google oynasi yopildi", "Окно Google было закрыто", "The Google window was closed"), "info");
      } else {
        showToast(err.message, "error");
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl transition-all duration-300">
          <div className="p-6 sm:p-8 relative">

            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {step === "success" ? tr(locale, "Muvaffaqiyatli!", "Успешно!", "Success!") : (isLoginMode ? t.loginTitle : t.registerTitle)}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                {step === "form" ? (isLoginMode ? t.loginSub : t.registerSub) : t.successState}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-[220px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {step === "form" && (
                  <motion.div
                    key="form-container"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="space-y-5"
                  >
                    {/* Sliding Pill Tab Selector */}
                    <div className="flex bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-2xl relative mb-2 border border-slate-200/30 dark:border-slate-800/30">
                      <button
                        type="button"
                        onClick={() => { setIsLoginMode(true); }}
                        className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${
                          isLoginMode ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {isLoginMode && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/50 dark:border-slate-700/50"
                            style={{ zIndex: -1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          />
                        )}
                        {t.loginTitle}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsLoginMode(false); }}
                        className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${
                          !isLoginMode ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {!isLoginMode && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/50 dark:border-slate-700/50"
                            style={{ zIndex: -1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          />
                        )}
                        {t.registerTitle}
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email Input */}
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                          {t.emailLabel}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.emailPlaceholder}
                          required
                          disabled={isLoading}
                          className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] outline-none transition-all dark:text-white text-sm"
                        />
                      </div>

                      {/* Password Input */}
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                          {t.passwordLabel}
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.passwordPlaceholder}
                          required
                          disabled={isLoading}
                          className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] outline-none transition-all dark:text-white text-sm"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#1A365D] to-[#F97316] hover:opacity-95 text-white font-bold shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLoginMode ? t.loginBtn : t.registerBtn)}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute w-full border-t border-slate-200 dark:border-slate-800"></div>
                      <span className="relative px-3 bg-white dark:bg-slate-950 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {t.orText}
                      </span>
                    </div>

                    {/* Premium Google Sign-In Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-center gap-3 px-4 shadow-sm font-bold text-slate-700 dark:text-slate-200 text-sm transition-all"
                    >
                      {/* SVG Google Logo */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.093-5.136 4.093-3.418 0-6.195-2.777-6.195-6.195s2.777-6.195 6.195-6.195c1.536 0 2.946.564 4.032 1.488l3.14-3.14C18.91 1.47 15.753.6 12.24.6 5.845.6.65 5.795.65 12.195s5.195 11.595 11.59 11.595c6.686 0 11.56-4.697 11.56-11.56 0-.693-.075-1.343-.205-1.945H12.24z"
                        />
                      </svg>
                      {t.googleBtn}
                    </motion.button>
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
                      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                      className="w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-5 border border-green-500/20"
                    >
                      <CheckCircle2 className="text-green-500" size={48} />
                    </motion.div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {tr(locale, "Tizimga kirildi!", "Вход выполнен!", "You are signed in!")}
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Glassmorphic Floating Toasts overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 55, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`fixed bottom-6 right-6 z-[99999] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl max-w-sm ${
              toast.type === "success"
                ? "bg-green-500/90 dark:bg-green-950/90 border-green-400/30 text-white"
                : toast.type === "error"
                ? "bg-red-500/90 dark:bg-red-950/90 border-red-400/30 text-white"
                : "bg-blue-500/90 dark:bg-blue-950/90 border-blue-400/30 text-white"
            }`}
          >
            <div className="shrink-0 flex items-center justify-center">
              {toast.type === "success" && <CheckCircle2 className="text-green-200 dark:text-green-400" size={20} />}
              {toast.type === "error" && <AlertCircle className="text-red-200 dark:text-red-400" size={20} />}
              {toast.type === "info" && <Info className="text-blue-200 dark:text-blue-400" size={20} />}
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-wide leading-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
