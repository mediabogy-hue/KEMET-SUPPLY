"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";

type Roles = {
  admin: boolean;
  orders_manager: boolean;
  finance_manager: boolean;
  product_manager: boolean;
  products_manager: boolean;
  merchant: boolean;
};

export type SessionUser = {
  uid: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles: Roles;
  isAdmin: boolean;
  isStaff: boolean;
  isMerchant: boolean;
};

type SessionState = {
  firebaseUser: User | null;
  sessionUser: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

async function roleExists(col: string, uid: string) {
  const snap = await getDoc(doc(db, col, uid));
  return snap.exists();
}

async function loadSession(u: User): Promise<SessionUser> {
  const uid = u.uid;

  const userSnap = await getDoc(doc(db, "users", uid));
  const userData: any = userSnap.exists() ? userSnap.data() : {};

  const [admin, orders_manager, finance_manager, product_manager, products_manager, merchant] =
    await Promise.all([
      roleExists("roles_admin", uid),
      roleExists("roles_orders_manager", uid),
      roleExists("roles_finance_manager", uid),
      roleExists("roles_product_manager", uid),
      roleExists("roles_products_manager", uid),
      roleExists("roles_merchant", uid),
    ]);

  const roles: Roles = { admin, orders_manager, finance_manager, product_manager, products_manager, merchant };
  const isAdmin = roles.admin;
  const isStaff = roles.admin || roles.orders_manager || roles.finance_manager || roles.product_manager || roles.products_manager;
  const isMerchant = roles.merchant;

  return {
    uid,
    email: u.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    isActive: userData.isActive,
    roles,
    isAdmin,
    isStaff,
    isMerchant,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const s = await loadSession(auth.currentUser);
      setSessionUser(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (!u) {
        setSessionUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const s = await loadSession(u);
        setSessionUser(s);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <Ctx.Provider value={{ firebaseUser, sessionUser, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}