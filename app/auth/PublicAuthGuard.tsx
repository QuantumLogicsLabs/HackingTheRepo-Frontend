"use client";

import { useEffect, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import { useAuth } from "@/context/AuthContext";

interface PublicAuthGuardProps {
  children: ReactElement;
}

/** Mirrors Vite `PublicRoute`: signed-in users skip auth screens and go to the dashboard. */
export default function PublicAuthGuard({ children }: PublicAuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) return <AuthLoadingScreen />;
  if (user) return null;

  return children;
}
