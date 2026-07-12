"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          {children}
          <Toaster
            position="bottom-right"
            gutter={10}
            toastOptions={{
              duration: 5000,
              style: {
                background: "var(--bg3)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                padding: "12px 14px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "var(--red, #f04848)", secondary: "#fff" },
                duration: 7000,
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
