"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import {
  CLOUD_CONNECTIONS_SECURITY_ASSURANCE_BODY,
  CLOUD_CONNECTIONS_SECURITY_ASSURANCE_LINK_LABEL,
  CLOUD_CONNECTIONS_SECURITY_ASSURANCE_TITLE,
} from "@/lib/cloud-connections-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Anchored security assurance band with Security & trust deep link. */
export function CloudConnectionsSecurityAssuranceBand(): ReactElement {
  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="cloud-connections-security-assurance-heading"
      data-testid="cloud-connections-security-assurance-band"
    >
      <h2 id="cloud-connections-security-assurance-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {CLOUD_CONNECTIONS_SECURITY_ASSURANCE_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {CLOUD_CONNECTIONS_SECURITY_ASSURANCE_BODY}
      </p>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          href="/administration/security-trust"
          className={cn(OPERATOR_LINK.nav, "font-medium")}
          data-testid="cloud-connections-security-assurance-link"
        >
          {CLOUD_CONNECTIONS_SECURITY_ASSURANCE_LINK_LABEL}
        </Link>
      </p>
    </section>
  );
}
