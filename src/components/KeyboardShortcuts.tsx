"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case "n":
          router.push("/jobs/new");
          break;
        case "d":
          router.push("/dashboard");
          break;
        case "?":
          alert("Keyboard Shortcuts:\n\nN → New Job\nD → Dashboard\n? → Show shortcuts");
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
