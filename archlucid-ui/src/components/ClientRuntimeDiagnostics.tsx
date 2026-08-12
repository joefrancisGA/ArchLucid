"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isClientDiagnosticsBannerEnabled } from "@/lib/client-diagnostics-banner-policy";
import {
  installClientRuntimeDiagnostics,
  type ClientDiagnosticsFinding,
} from "@/lib/client-runtime-diagnostics";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reportClientError } from "@/lib/error-telemetry";
import { ensureAppInsights } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

const MAX_BANNER_FINDINGS = 5;

function findingToError(finding: ClientDiagnosticsFinding): Error {
  const error = new Error(`[${finding.kind}] ${finding.message}`);

  if (finding.detail !== undefined && finding.detail.length > 0) {
    error.stack = finding.detail;
  }

  return error;
}

/**
 * Shell diagnostics: reports client failures to API + App Insights.
 * On-page banner is off by default; opt in with `NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=1`.
 */
export function ClientRuntimeDiagnostics() {
  const pathname = usePathname();
  const [findings, setFindings] = useState<ClientDiagnosticsFinding[]>([]);
  const bannerEnabled = isClientDiagnosticsBannerEnabled();
  const handleRef = useRef<ReturnType<typeof installClientRuntimeDiagnostics> | null>(null);

  const publish = useCallback(
    (finding: ClientDiagnosticsFinding) => {
      const error = findingToError(finding);
      reportClientError(error, {
        source: "client-runtime-diagnostics",
        kind: finding.kind,
        href: finding.href ?? "",
        pathname: typeof window !== "undefined" ? window.location.pathname : "",
      });

      void ensureAppInsights().then((ai) => {
        if (ai === null) {
          return;
        }

        ai.trackException({ exception: error }, { kind: finding.kind, href: finding.href ?? "" });
        ai.trackEvent(
          { name: "ClientRuntimeDiagnostic" },
          {
            kind: finding.kind,
            message: finding.message.slice(0, 200),
            href: finding.href ?? "",
          },
        );
      });

      if (!bannerEnabled) {
        return;
      }

      setFindings((prev) => [finding, ...prev].slice(0, MAX_BANNER_FINDINGS));
    },
    [bannerEnabled],
  );

  useEffect(() => {
    const handle = installClientRuntimeDiagnostics(publish);
    handleRef.current = handle;

    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, [publish]);

  useEffect(() => {
    handleRef.current?.onLocationCommitted();
  }, [pathname]);

  if (!bannerEnabled || findings.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        DESIGN_TOKENS.callout.blocked,
        // Full-bleed docked bar: drop the callout's rounding and side/bottom borders so only the top rose accent shows.
        "fixed inset-x-0 bottom-0 z-[11000] rounded-none border-x-0 border-b-0 border-t-2 border-rose-700 p-3 shadow-lg dark:border-rose-500",
      )}
      data-testid="client-runtime-diagnostics-banner"
      role="alert"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Client diagnostics (pre-release)
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-rose-700 bg-white dark:border-rose-400 dark:bg-rose-900"
            onClick={() => setFindings([])}
          >
            Dismiss
          </Button>
        </div>
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {findings.map((finding, index) => (
            <li key={`${finding.kind}-${index}-${finding.message.slice(0, 40)}`}>
              <span className="font-semibold">{finding.kind}</span>
              {": "}
              {finding.message}
              {finding.href !== undefined && finding.href.length > 0 ? (
                <>
                  {" "}
                  <code className="break-all">{finding.href}</code>
                </>
              ) : null}
              {finding.detail !== undefined && finding.detail.length > 0 ? (
                <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-neutral-100 p-1 font-mono text-[11px] dark:bg-neutral-800">
                  {finding.detail}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
        <p className={cn("m-0 opacity-90", OPERATOR_TYPOGRAPHY.helper)}>
          Also posted to <code>POST /v1/diagnostics/client-error</code> and App Insights when configured.
          Check DevTools Console / Network while reproducing. Banner enabled via{" "}
          <code>NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=1</code>.
        </p>
      </div>
    </div>
  );
}
