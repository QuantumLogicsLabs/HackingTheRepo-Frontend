"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "@/views/AuthPage.css";

interface AuthLayoutProps {
  title: string;
  sub: string;
  children: ReactNode;
}

export default function AuthLayout({ title, sub, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <NextLink href="/" className="auth-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          RepoMind
        </NextLink>
        <ThemeToggle className="theme-toggle--auth" />
      </div>
      <div className="auth-card card fade-in">
        <h1 className="auth-title">{title}</h1>
        <p className="auth-sub">{sub}</p>
        {children}
      </div>
    </div>
  );
}
