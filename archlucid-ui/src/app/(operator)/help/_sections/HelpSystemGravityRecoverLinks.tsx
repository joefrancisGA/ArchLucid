"use client";

import Link from "next/link";
import { useMemo } from "react";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import {
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_LAST_ARCHITECTURE_LINK_LABEL,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_TRUST_LINKS,
} from "@/lib/system-gravity-help-guide-content";
import { resolveWorkingAltRHref } from "@/lib/resolve-working-alt-r-href";
import {
  isHelpTopicExcludedForProductLine,
  isSecureNowProductLine,
} from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

function helpTopicSlugFromInAppHref(href: string): string | null {
  const normalized = href.trim();

  if (!normalized.startsWith("/help/")) {
    return null;
  }

  const slug = normalized.slice("/help/".length).split(/[?#]/)[0]?.trim() ?? "";

  return slug.length > 0 ? slug : null;
}

function filterTrustLinks(
  productLineId: ReturnType<typeof resolveProductLineIdFromEnv>,
): typeof SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_TRUST_LINKS {
  return SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_TRUST_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** Recover links for `/help/system-gravity` — last architecture when cached, architecture list fallback. */
export function HelpSystemGravityRecoverLinks(): React.ReactElement {
  const productLineId = resolveProductLineIdFromEnv();
  const trustLinks = filterTrustLinks(productLineId);

  const lastArchitectureHref = useMemo(() => {
    const lastOpenArchitectureId = readCachedLastOpenArchitectureId();
    const resolved = resolveWorkingAltRHref({ lastOpenArchitectureId });

    return resolved.reason === "last-open-architecture" ? resolved.href : null;
  }, []);

  return (
    <>
      {lastArchitectureHref !== null && !isSecureNowProductLine(productLineId) ? (
        <>
          <Link
            className={OPERATOR_LINK.inline}
            href={lastArchitectureHref}
            data-testid="help-system-gravity-recover-last-architecture"
          >
            {SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_LAST_ARCHITECTURE_LINK_LABEL}
          </Link>
          {" · "}
        </>
      ) : null}
      <Link
        className={OPERATOR_LINK.inline}
        href={SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK.href}
        data-testid="help-system-gravity-recover-architecture-list"
      >
        {SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK.label}
      </Link>
      {trustLinks.length > 0 ? (
        <>
          {" · "}
          {trustLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <Link className={OPERATOR_LINK.inline} href={link.href} data-testid={`help-system-gravity-trust-link-${index}`}>
                {link.label}
              </Link>
            </span>
          ))}
        </>
      ) : null}
    </>
  );
}
