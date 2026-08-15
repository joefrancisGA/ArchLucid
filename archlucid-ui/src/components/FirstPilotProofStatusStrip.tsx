"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FirstPilotTechnicalCommandDisclosure } from "@/components/FirstPilotTechnicalCommandDisclosure";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import {
  firstPilotProofNotRunCopy,
  FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND,
  FIRST_PILOT_PROOF_REFRESH_SNAPSHOT_COMMAND,
  FIRST_PILOT_PROOF_STATUS_UNAVAILABLE,
  FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
} from "@/lib/first-pilot-diagnostics-copy";
import {
  proofStatusDispositionClass,
  type FirstPilotProofStatusSnapshot,
} from "@/lib/first-pilot-proof-status-snapshot";

function loadedSummaryLine(snapshot: FirstPilotProofStatusSnapshot): string {
  if (snapshot.blockCount === 0 && snapshot.warnCount === 0) {
    return "No blocks or warnings.";
  }

  return `${snapshot.blockCount} block · ${snapshot.warnCount} warn`;
}

/** Home strip: last local collect-first-pilot-proof verdict (static snapshot from CI/proof). */
export function FirstPilotProofStatusStrip() {
  const [snapshot, setSnapshot] = useState<FirstPilotProofStatusSnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/first-pilot-proof-status-snapshot.json", { cache: "no-store" });

        if (!response.ok) {
          if (!canceled) {
            setLoadFailed(true);
          }

          return;
        }

        const json = (await response.json()) as FirstPilotProofStatusSnapshot;

        if (!canceled) {
          setSnapshot(json);
          setLoadFailed(false);
        }
      }
      catch {
        if (!canceled) {
          setLoadFailed(true);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, []);

  if (loadFailed || snapshot === null) {
    return (
      <div
        className={cn("rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 p-3 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="first-pilot-proof-status-strip"
      >
        <p className="m-0">{FIRST_PILOT_PROOF_STATUS_UNAVAILABLE}</p>
        <p className="m-0 mt-2">
          <Link href="/administration/system-health" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            {FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA}
          </Link>
        </p>
        <FirstPilotTechnicalCommandDisclosure
          commands={[FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND, FIRST_PILOT_PROOF_REFRESH_SNAPSHOT_COMMAND]}
        />
      </div>
    );
  }

  if (snapshot.disposition === "NOT_RUN") {
    return (
      <div
        className={cn("rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 p-3 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="first-pilot-proof-status-strip"
      >
        <p className="m-0">{firstPilotProofNotRunCopy()}</p>
        <p className="m-0 mt-2">
          <Link href="/administration/system-health" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            {FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA}
          </Link>
        </p>
        <FirstPilotTechnicalCommandDisclosure
          commands={[FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND, FIRST_PILOT_PROOF_REFRESH_SNAPSHOT_COMMAND]}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 ${proofStatusDispositionClass(snapshot.disposition)}`}
      data-testid="first-pilot-proof-status-strip"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold uppercase tracking-wide opacity-80", OPERATOR_NAV_GROUP_LABEL)}>Last proof collect</span>
        <span className={cn("rounded-full border border-current/20 px-2 py-0.5 font-semibold uppercase tracking-wide", OPERATOR_NAV_GROUP_LABEL)}>
          {snapshot.verdict}
        </span>
        {snapshot.proofFolder ? (
          <span className={cn("font-mono opacity-80", OPERATOR_TYPOGRAPHY.badge)}>{snapshot.proofFolder}</span>
        ) : null}
      </div>
      <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{loadedSummaryLine(snapshot)}</p>
      <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {snapshot.remediationLinks.map((link) => (
          <li key={link.path}>
            <Link
              href={resolveInAppDocHref(link.path)}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
