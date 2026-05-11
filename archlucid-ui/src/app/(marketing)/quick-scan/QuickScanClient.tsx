"use client";

import Link from "next/link";
import { useCallback, useState, type ReactElement } from "react";

import { findingSeverityLabel } from "@/lib/finding-severity-label";

type QuickScanFinding = Readonly<{
  title: string;
  description: string;
  severity?: number;
}>;

type QuickScanResponse = Readonly<{
  scanId: string;
  summary: string;
  completedUtc?: string;
  findings?: QuickScanFinding[];
}>;

/**
 * No-sign-in quick scan: POST /v1/architecture/quick-scan via same-origin proxy (server attaches upstream auth).
 * Marketing shell avoids `apiPostJson` so anonymous visitors are not blocked on OIDC readiness.
 */
export function QuickScanClient(): ReactElement {
  const [systemName, setSystemName] = useState("");
  const [cloudProvider, setCloudProvider] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuickScanResponse | null>(null);

  const onSubmit = useCallback(async () => {
    const sys = systemName.trim();
    const provider = cloudProvider.trim();
    const desc = description.trim();

    if (sys.length === 0 || provider.length === 0 || desc.length === 0) {
      setError("System name, cloud provider, and description are required.");

      return;
    }

    setError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/proxy/v1/architecture/quick-scan", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          systemName: sys,
          cloudProvider: provider,
          description: desc,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text.length > 0 ? text : `Quick scan failed (HTTP ${String(res.status)})`);
      }

      const data = JSON.parse(text) as QuickScanResponse;
      setResult(data);
    }
    catch (e: unknown) {
      const msg = e instanceof Error && e.message.trim().length > 0 ? e.message : "Quick scan failed.";

      setError(msg);
    }
    finally {
      setSubmitting(false);
    }
  }, [systemName, cloudProvider, description]);

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Quick scan</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Single-pass architecture read — no sign-in. Results are ephemeral and not stored as a full operator run.
        </p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-system-name">
            System name
          </label>
          <input
            id="quick-scan-system-name"
            type="text"
            value={systemName}
            onChange={(ev) => {
              setSystemName(ev.target.value);
            }}
            autoComplete="off"
            className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            placeholder="e.g. Claims intake API"
          />
        </div>

        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
            htmlFor="quick-scan-cloud-provider"
          >
            Cloud provider
          </label>
          <input
            id="quick-scan-cloud-provider"
            type="text"
            value={cloudProvider}
            onChange={(ev) => {
              setCloudProvider(ev.target.value);
            }}
            autoComplete="off"
            className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            placeholder="e.g. Azure"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-description">
            Description
          </label>
          <textarea
            id="quick-scan-description"
            value={description}
            onChange={(ev) => {
              setDescription(ev.target.value);
            }}
            rows={5}
            className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            placeholder="Scope, constraints, and context for the quick scan…"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={submitting || !systemName.trim() || !cloudProvider.trim() || !description.trim()}
        onClick={() => {
          void onSubmit();
        }}
        data-testid="quick-scan-submit"
        className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-sky-500 dark:hover:bg-sky-600"
      >
        {submitting ? "Scanning…" : "Run quick scan"}
      </button>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Prefer the simulator-only demo that creates a run?{" "}
        <Link href="/quick-start" className="font-medium text-sky-700 underline dark:text-sky-400">
          Open quick start
        </Link>
        .
      </p>

      {error !== null && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      )}

      {result !== null && (
        <section className="space-y-4" data-testid="quick-scan-results" aria-label="Quick scan results">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Summary</h2>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{result.summary}</p>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Scan ID: {result.scanId}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Findings</h2>
            <ul className="mt-2 space-y-3">
              {(result.findings ?? []).map((finding) => (
                <li key={`${finding.title}:${finding.description}`} data-testid="quick-scan-finding-card" className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
                  <div className="font-medium text-neutral-900 dark:text-neutral-50">{finding.title}</div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {findingSeverityLabel(finding.severity)}
                  </div>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{finding.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
