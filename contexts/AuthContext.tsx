"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/admin";

export interface UserProfile {
  uid: string;
  role: "customer" | "master" | null;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  services?: string[];
  basePrice?: number;
  region?: string;
  district?: string;
  bio?: string;
  telegram?: string;
  instagram?: string;
  website?: string;
  isVerified?: boolean;
  blocked?: boolean;
  lat?: number;
  lng?: number;
  /** Legacy field. Ratings are now derived from the `reviews` collection (see lib/reviews.ts). */
  rating?: number;
  createdAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
    } catch (err) {
      console.warn("Profile fetch error:", err);
      setProfile(null);
    }
  };

  // Admin = verified allow-listed email, or a hand-made `admins/<uid>` document.
  const resolveAdmin = async (u: User) => {
    if (u.emailVerified && isAdminEmail(u.email)) return true;
    try {
      return (await getDoc(doc(db, "admins", u.uid))).exists();
    } catch {
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const [, admin] = await Promise.all([fetchProfile(currentUser.uid), resolveAdmin(currentUser)]);
        setIsAdmin(admin);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
