import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoMind — AI PR Bot",
  description:
    "Describe a code change in plain English. RepoMind clones the repository, applies the changes via AI, and opens a pull request.",
};

const themeInitScript = `(function(){try{var k="rm_theme",s=localStorage.getItem(k),t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <KeyboardShortcuts />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
