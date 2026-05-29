"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";
import {
  proofStatusDispositionClass,
  type FirstPilotProofStatusSnapshot,
} from "@/lib/first-pilot-proof-status-snapshot";

/** Home strip: last local collect-first-pilot-proof verdict (static snapshot from CI/proof). */
export function FirstPilotProofStatusStrip() {
  const [snapshot, setSnapshot] = useState<FirstPilotProofStatusSnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/first-pilot-proof-status-snapshot.json", { cache: "no-store" });

        if (!response.ok) {
          if (!cancelled) {
            setLoadFailed(true);
          }

          return;
        }

        const json = (await response.json()) as FirstPilotProofStatusSnapshot;

        if (!cancelled) {
          setSnapshot(json);
          setLoadFailed(false);
        }
      }
      catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadFailed || snapshot === null) {
    return (
      <div
        className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
        data-testid="first-pilot-proof-status-strip"
      >
        <p className="m-0">
          Proof status not loaded. Run{" "}
          <code className="font-mono text-xs">dotnet run --project ArchLucid.Cli -- pilot proof</code> then{" "}
          <code className="font-mono text-xs">python scripts/ci/write_first_pilot_proof_status_snapshot.py</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 ${proofStatusDispositionClass(snapshot.disposition)}`}
      data-testid="first-pilot-proof-status-strip"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Last proof collect</span>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {snapshot.verdict}
        </span>
        {snapshot.proofFolder ? (
          <span className="font-mono text-[10px] opacity-80">{snapshot.proofFolder}</span>
        ) : null}
      </div>
      <p className="m-0 mt-2 text-sm leading-relaxed">
        {snapshot.blockCount} block · {snapshot.warnCount} warn — {snapshot.nextAction}
      </p>
      <ul className="m-0 mt-2 list-none space-y-1 p-0 text-xs">
        {snapshot.remediationLinks.map((link) => (
          <li key={link.path}>
            <Link
              href={`${DEFAULT_GITHUB_BLOB_BASE}/${link.path}`}
              className="font-medium underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
