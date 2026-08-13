"use client";

import { useCallback, useEffect, useState } from "react";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PrivacyEvidenceOrientationStrip } from "@/components/marketing/PrivacyEvidenceOrientationStrip";
import { PrivacyPolicyRelatedDocuments } from "@/components/marketing/privacy-policy/PrivacyPolicyRelatedDocuments";
import { PrivacyPolicyTableOfContents } from "@/components/marketing/privacy-policy/PrivacyPolicyTableOfContents";
import { MARKETING_SURFACES } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import type { PrivacyPolicyMetadata, PrivacyPolicyRelatedDocument } from "@/lib/privacy-policy-content";
import { PRIVACY_POLICY_LAYOUT } from "@/lib/privacy-policy-layout";

const PRIVACY_FOCUSED_READING_BODY_CLASS = "privacy-focused-reading";
const PRIVACY_CONTENT_ID = "privacy-policy-content";

export type PrivacyPolicyPageClientProps = {
  readonly metadata: PrivacyPolicyMetadata;
  readonly bodyMarkdown: string;
  readonly headings: readonly HelpMarkdownHeading[];
  readonly quickNavLinks: ReadonlyArray<{ readonly label: string; readonly href: string }>;
  readonly relatedDocuments: readonly PrivacyPolicyRelatedDocument[];
};

function formatMetadataDate(value: string | null, label: string): string | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }

  return `${label}: ${value.trim()}`;
}

export function PrivacyPolicyPageClient(props: PrivacyPolicyPageClientProps): React.JSX.Element {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [focusedReading, setFocusedReading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (focusedReading) {
      document.body.classList.add(PRIVACY_FOCUSED_READING_BODY_CLASS);
    } else {
      document.body.classList.remove(PRIVACY_FOCUSED_READING_BODY_CLASS);
    }

    window.dispatchEvent(new CustomEvent("privacy-focused-reading-change"));

    return () => {
      document.body.classList.remove(PRIVACY_FOCUSED_READING_BODY_CLASS);
      window.dispatchEvent(new CustomEvent("privacy-focused-reading-change"));
    };
  }, [focusedReading]);

  useEffect(() => {
    const onScroll = (): void => {
      const scrollElement = document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;

      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 480);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, []);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  const effectiveLabel = formatMetadataDate(props.metadata.effectiveDate, "Effective date");
  const reviewedLabel = formatMetadataDate(props.metadata.lastReviewedUtc, "Last reviewed (UTC)");

  return (
    <div className={PRIVACY_POLICY_LAYOUT.page} data-testid="privacy-policy-page">
      <a href={`#${PRIVACY_CONTENT_ID}`} className={PRIVACY_POLICY_LAYOUT.skipLink}>
        Skip to privacy policy
      </a>

      <div
        className={PRIVACY_POLICY_LAYOUT.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
        aria-label="Reading progress"
        data-testid="privacy-policy-reading-progress"
      >
        <div className={PRIVACY_POLICY_LAYOUT.progressBar} style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className={PRIVACY_POLICY_LAYOUT.grid}>
        <article id={PRIVACY_CONTENT_ID} className={PRIVACY_POLICY_LAYOUT.article} tabIndex={-1}>
          <header className={PRIVACY_POLICY_LAYOUT.header}>
            <h1 className={PRIVACY_POLICY_LAYOUT.title}>Privacy Policy</h1>
            <p className={PRIVACY_POLICY_LAYOUT.lede}>
              How ArchLucid collects, uses, shares, retains, and protects personal information for website visitors
              and product users.
            </p>
            <div className={PRIVACY_POLICY_LAYOUT.metaRow}>
              {effectiveLabel !== null ? <span>{effectiveLabel}</span> : null}
              {reviewedLabel !== null ? <span>{reviewedLabel}</span> : null}
              <span>Document version: {props.metadata.documentVersion}</span>
            </div>

            <div className={PRIVACY_POLICY_LAYOUT.utilities}>
              <button type="button" className={PRIVACY_POLICY_LAYOUT.utilityButton} onClick={handlePrint} aria-label="Print privacy policy">
                Print
              </button>
              <button
                type="button"
                className={PRIVACY_POLICY_LAYOUT.utilityButton}
                onClick={() => void handleCopyLink()}
                aria-label="Copy link to privacy policy"
              >
                {copyState === "copied" ? "Link copied" : copyState === "failed" ? "Copy failed" : "Copy link"}
              </button>
              <button
                type="button"
                className={PRIVACY_POLICY_LAYOUT.utilityButton}
                onClick={() => {
                  setFocusedReading((value) => !value);
                }}
                aria-pressed={focusedReading}
                data-testid="privacy-policy-focused-reading-toggle"
              >
                {focusedReading ? "Show site navigation" : "Focused reading"}
              </button>
            </div>

            {props.quickNavLinks.length > 0 ? (
              <nav aria-label="Quick navigation" className={PRIVACY_POLICY_LAYOUT.quickNav} data-testid="privacy-policy-quick-nav">
                <p className={PRIVACY_POLICY_LAYOUT.quickNavTitle}>Quick navigation</p>
                <p className={PRIVACY_POLICY_LAYOUT.quickNavNote}>
                  These links help you navigate the policy. The complete policy below governs.
                </p>
                <ul className={PRIVACY_POLICY_LAYOUT.quickNavList}>
                  {props.quickNavLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className={PRIVACY_POLICY_LAYOUT.quickNavLink}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="xl:hidden">
              <PrivacyPolicyTableOfContents headings={props.headings} variant="mobile" />
            </div>
          </header>

          <PrivacyEvidenceOrientationStrip />

          {props.bodyMarkdown.length > 0 ? (
            <div className="mt-8" data-testid="privacy-policy-body">
              <MarketingAccessibilityMarkdownFragment
                markdownBody={props.bodyMarkdown}
                tableCaption="ArchLucid privacy policy details"
                presentation="privacy"
              />
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
              <p className="text-al-text-secondary">
                The privacy policy content was not found at build time. Contact{" "}
                <a
                  className={MARKETING_SURFACES.inlineLink}
                  href="mailto:privacy@archlucid.net"
                >
                  privacy@archlucid.net
                </a>{" "}
                for a copy.
              </p>
            </div>
          )}

          <PrivacyPolicyRelatedDocuments documents={props.relatedDocuments} />
        </article>

        <div className="hidden xl:block">
          <PrivacyPolicyTableOfContents headings={props.headings} variant="desktop" />
        </div>
      </div>

      {showBackToTop ? (
        <button
          type="button"
          className={PRIVACY_POLICY_LAYOUT.backToTop}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Back to top"
          data-testid="privacy-policy-back-to-top"
        >
          Back to top
        </button>
      ) : null}
    </div>
  );
}
