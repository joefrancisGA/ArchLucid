"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";

import {
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR,
  AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS,
  AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_INTRO,
  AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_SECTIONS,
} from "@/lib/audit-trail-help-guide-content";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

function technicalReferenceHashShouldOpen(): boolean {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "").trim() : "";

  return hash === "technical-reference" || hash === AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR;
}

/** Lazy-mounts engineering detail so collapsed technical reference stays out of primary page text scans. */
export function HelpAuditTrailTechnicalReference(): ReactElement {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncOpenFromDom = (): void => {
      const details = detailsRef.current;

      if (details === null) {
        return;
      }

      // Deep links to enforcement detail must open before the lazy body mounts.
      if (technicalReferenceHashShouldOpen()) {
        details.open = true;
      }

      if (details.open) {
        setOpen(true);
      }
    };

    syncOpenFromDom();
    window.addEventListener("hashchange", syncOpenFromDom);
    const frameId = window.requestAnimationFrame(syncOpenFromDom);

    return () => {
      window.removeEventListener("hashchange", syncOpenFromDom);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      id="technical-reference"
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-audit-trail-technical-reference"
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className={cn(
          "cursor-pointer select-none font-semibold text-al-text-primary",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        Technical reference
      </summary>
      <div className={HELP_PAGE_LAYOUT.detailsBody}>
        {/* Always-mounted target so HelpTopicHashScroll can open this disclosure before the body mounts. */}
        <span id={AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR} className="sr-only">
          Immutability enforcement
        </span>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_INTRO}</p>
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            href={AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.href}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
          >
            {AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.label}
          </Link>
        </p>
        {open ? (
          <div className="mt-4 space-y-4" data-testid="help-audit-trail-technical-reference-body">
            {AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.title}</h3>
                <ul className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.bulletList)}>
                  {section.lines.map((line) => (
                    <li key={line}>
                      <code className="text-sm">{line}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
