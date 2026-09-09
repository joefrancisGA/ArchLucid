"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import {
  QUICK_SCAN_FORM_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { QuickScanForm } from "@/app/(marketing)/quick-scan/QuickScanForm";
import type { QuickScanClientState } from "@/app/(marketing)/quick-scan/use-quick-scan-client";
import { TurnstileBotChallenge } from "@/components/auth/TurnstileBotChallenge";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { shouldOfferQuickScanSample } from "@/lib/quick-scan/quick-scan-capacity-state";
import { QUICK_SCAN_RECEIVE_ITEMS } from "@/lib/quick-scan/quick-scan-constants";
import {
  parseQuickScanPrivacyDisclosureOpenFromSearch,
  quickScanPrivacyDisclosureHrefFromSearch,
} from "@/lib/quick-scan/quick-scan-privacy-disclosure-url";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

type QuickScanWorkspaceSectionProps = {
  readonly client: QuickScanClientState;
};

/** Primary Quick Scan workspace — form, privacy disclosure, and demonstration limits rail. */
export function QuickScanWorkspaceSection(props: QuickScanWorkspaceSectionProps): ReactElement {
  const { client } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/quick-scan";
  const searchParams = useSearchParams();
  const quickScanPrivacyDisclosureOpenParam = searchParams.get("quickScanPrivacyDisclosureOpen");
  const [privacyDisclosureOpen, setPrivacyDisclosureOpenState] = useState(() =>
    parseQuickScanPrivacyDisclosureOpenFromSearch(quickScanPrivacyDisclosureOpenParam),
  );

  const syncPrivacyDisclosureOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(quickScanPrivacyDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPrivacyDisclosureOpen = useCallback(
    (open: boolean) => {
      setPrivacyDisclosureOpenState(open);
      syncPrivacyDisclosureOpenToUrl(open);
    },
    [syncPrivacyDisclosureOpenToUrl],
  );

  useEffect(() => {
    setPrivacyDisclosureOpenState(parseQuickScanPrivacyDisclosureOpenFromSearch(quickScanPrivacyDisclosureOpenParam));
  }, [quickScanPrivacyDisclosureOpenParam]);

  return (
    <div
      data-testid="quick-scan-workspace"
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
    >
      <div className="min-w-0 space-y-6">
        <form id={QUICK_SCAN_FORM_ID} className="space-y-6" onSubmit={client.handleFormSubmit} noValidate>
          <QuickScanForm
            values={client.formValues}
            fieldErrors={client.visibleFieldErrors}
            disabled={client.submitting}
            onChange={client.setFormValues}
            onFieldBlur={client.markFieldTouched}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" disabled={!client.canSubmit} data-testid="quick-scan-submit">
              {client.submitting ? "Analyzing architecture…" : "Analyze architecture"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={client.loadExample}
              disabled={client.submitting}
              data-testid="quick-scan-use-example"
            >
              Use an example
            </Button>
            {client.submitting ? (
              <Button type="button" variant="outline" onClick={client.cancelSubmit} data-testid="quick-scan-cancel">
                Cancel analysis
              </Button>
            ) : null}
            {!client.canSubmit && client.incompleteReason !== null ? (
              <p className={MARKETING_TYPOGRAPHY.meta} role="status">
                {client.incompleteReason}
              </p>
            ) : null}
            {client.aiSubmitBlocked ? (
              <p className={MARKETING_TYPOGRAPHY.meta} role="status" data-testid="quick-scan-submit-blocked">
                {client.submitBlockedMessage}
              </p>
            ) : null}
          </div>

          {client.submitting ? (
            <p className={MARKETING_TYPOGRAPHY.meta} role="status" data-testid="quick-scan-progress">
              {client.statusMessage}
            </p>
          ) : null}

          {shouldOfferQuickScanSample(client.status) ? (
            <p className={MARKETING_TYPOGRAPHY.meta}>
              Prefer to explore a prebuilt sample without running an AI analysis?{" "}
              <button
                type="button"
                onClick={() => {
                  client.showSampleResult(client.capacityState);
                }}
                className={MARKETING_SURFACES.inlineLink}
              >
                View the interactive sample
              </button>
              {" · "}
              <Link
                href="/get-started"
                className={MARKETING_SURFACES.inlineLink}
                onClick={() => {
                  client.onConversionClick("demo");
                }}
              >
                Start a guided demo
              </Link>
            </p>
          ) : null}
        </form>

        <details
          className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
          data-testid="quick-scan-privacy-disclosure"
          open={privacyDisclosureOpen}
          onToggle={(event) => {
            setPrivacyDisclosureOpen(event.currentTarget.open);
          }}
        >
          <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>Privacy and data handling</summary>
          <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
            <p className={cn("m-0 text-al-text-secondary", TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro)}>
              Your description is sent to an AI provider to generate this demonstration and is not stored as a workspace
              review. Temporary security logs (IP address, request metadata, and token usage) may be retained briefly for
              abuse prevention. ArchLucid does not use Quick Scan submissions to train models. Do not submit secrets,
              credentials, personal health information, or other regulated data.
            </p>
            <p className={cn("m-0 mt-3", MARKETING_TYPOGRAPHY.body)}>
              <Link href="/help/data-handling" className={MARKETING_SURFACES.inlineLink}>
                Read our data handling guide
              </Link>
              {" · "}
              <Link href="/help/security-trust" className={MARKETING_SURFACES.inlineLink}>
                Security overview
              </Link>
            </p>
          </div>
        </details>

        <div
          id={client.statusRegionId}
          role="status"
          aria-live="polite"
          className={client.submitting ? MARKETING_TYPOGRAPHY.meta : "sr-only"}
        >
          {client.statusMessage}
        </div>

        {client.captchaChallengeRequired && client.turnstileConfigured ? (
          <div className={cn(DESIGN_TOKENS.callout.warn, "p-4")} data-testid="quick-scan-captcha-challenge">
            <p className={MARKETING_TYPOGRAPHY.body}>
              Complete the security check below, then choose Analyze architecture again.
            </p>
            <TurnstileBotChallenge onTokenChange={client.handleBotChallengeTokenChange} />
          </div>
        ) : null}

        {client.capacityMessage !== null ? (
          <div className={cn(DESIGN_TOKENS.callout.warn, "p-4")}>
            <p>{client.capacityMessage}</p>
            {shouldOfferQuickScanSample(client.status) ? (
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    client.showSampleResult(client.capacityState);
                  }}
                  className="font-medium underline"
                >
                  View a sample result
                </button>
                <Link
                  href={buildAuthSignInHref({ returnPath: "/quick-scan" })}
                  className="font-medium underline"
                  onClick={() => {
                    client.onConversionClick("sign-in");
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/contact"
                  className="font-medium underline"
                  onClick={() => {
                    client.onConversionClick("demo");
                  }}
                >
                  Request a demonstration
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {client.error !== null ? (
          <p role="alert" className={DESIGN_TOKENS.callout.blocked}>
            {client.error}
          </p>
        ) : null}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <section className={MARKETING_SURFACES.cardComfort}>
          <h2 className={MARKETING_TYPOGRAPHY.cardTitle}>What you will receive</h2>
          <ul className={cn("mt-3 list-disc space-y-2 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {QUICK_SCAN_RECEIVE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={cn(MARKETING_SURFACES.mutedPanel, "border border-dashed border-neutral-300 dark:border-neutral-600")}>
          <h2 className={MARKETING_TYPOGRAPHY.cardTitle}>Demonstration limits</h2>
          <ul className={cn("mt-3 space-y-2", MARKETING_TYPOGRAPHY.body)}>
            <li>Single-pass analysis with a concise output cap</li>
            <li>No workspace persistence or approval workflow</li>
            <li>Daily demonstration capacity may apply</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
