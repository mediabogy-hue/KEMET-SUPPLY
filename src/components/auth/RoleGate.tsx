"use client";
import React from "react";
import { useSession } from "./SessionProvider";

type Props = {
  require?: "admin" | "staff" | "merchant";
  children: React.ReactNode;
};

export default function RoleGate({ require, children }: Props) {
  const { loading, sessionUser } = useSession();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!sessionUser) return <div className="p-6">Please login.</div>;

  if (require === "admin" && !sessionUser.isAdmin) return <div className="p-6">Not authorized.</div>;
  if (require === "staff" && !sessionUser.isStaff) return <div className="p-6">Not authorized.</div>;
  if (require === "merchant" && !sessionUser.isMerchant) return <div className="p-6">Not authorized.</div>;

  return <>{children}</>;
}