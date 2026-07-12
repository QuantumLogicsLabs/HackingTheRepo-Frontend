"use client";

import NextLink from "next/link";
import type { ReactElement } from "react";
import LandingPageContent, {
  type LandingLinkProps,
} from "@/components/landing/LandingPageContent";
import PublicLandingGuard from "./PublicLandingGuard";

function LandingLink({ href, className, style, children }: LandingLinkProps) {
  return (
    <NextLink href={href} className={className} style={style}>
      {children}
    </NextLink>
  );
}

export default function LandingPageClient(): ReactElement {
  return (
    <PublicLandingGuard>
      <LandingPageContent Link={LandingLink} />
    </PublicLandingGuard>
  );
}
