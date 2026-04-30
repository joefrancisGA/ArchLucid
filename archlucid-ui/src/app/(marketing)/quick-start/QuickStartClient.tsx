"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { resolveMarketingLiveDemoApiBase } from "@/lib/marketing-live-demo-api-base";

type QuickStartFindingSummary = Readonly<{ title: string; severity: string }>;

type QuickStartApiResponse = Readonly<{
  runId: string;
  manifestId: string;
  topFindings: QuickStartFindingSummary[];
  runDetailUrl: string;
}>;

const PRESETS = ["microservices", "monolith-migration", "event-driven"] as const;

function isAbsoluteHttpHttpsUrl(href: string): boolean {

  try {

    const u = new URL(href);

    return u.protocol === "http:" || u.protocol === "https:";


  }


  catch {

    return false;

  }


}

const PHASE_LABELS = [
  "Creating architecture run",
  "Running simulator agents",
  "Committing manifest",
] as const;

function phaseFromElapsedMs(ms: number): number {

  if (ms >= 5000)

    return 2;


  if (ms >= 2000)

    return 1;


  return 0;

}

export function QuickStartClient(): ReactElement {

  const apiBaseRef = useRef(resolveMarketingLiveDemoApiBase());
  const tickerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);


  const [description, setDescription] = useState("");
  const [presetId, setPresetId] = useState<(typeof PRESETS)[number] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuickStartApiResponse | null>(null);
  const [visualPhase, setVisualPhase] = useState(0);

  useEffect(() => {
    if (!submitting) {


      if (tickerRef.current !== null) {

        window.clearInterval(tickerRef.current);

        tickerRef.current = null;


      }

      startedAtRef.current = null;

      return;


    }

    startedAtRef.current = performance.now();

    tickerRef.current = window.setInterval(() => {

      const t0 = startedAtRef.current;

      if (t0 === null)

        return;


      setVisualPhase(phaseFromElapsedMs(performance.now() - t0));

    }, 160);

    return (): void => {


      if (tickerRef.current !== null) {

        window.clearInterval(tickerRef.current);

        tickerRef.current = null;


      }

    };

  }, [submitting]);

  const selectPreset = useCallback((id: (typeof PRESETS)[number]): void => {


    setPresetId((current) => (current === id ? undefined : id));


    setError(null);


    setResult(null);

  }, []);

  const stopTicker = useCallback((): void => {

    if (tickerRef.current !== null) {


      window.clearInterval(tickerRef.current);

      tickerRef.current = null;


    }

    startedAtRef.current = null;

  }, []);

  const onSubmit = useCallback(async () => {

    const base = apiBaseRef.current.trim();

    if (base.length === 0) {


      setError("Set NEXT_PUBLIC_ARCHLUCID_API_BASE_URL (or related) to reach the quick-start API.");

      return;


    }

    const trimmed = description.trim();


    if (trimmed.length === 0 && presetId === undefined) {


      setError("Add a description or pick a preset.");

      return;


    }

    setError(null);

    setResult(null);

    setSubmitting(true);


    setVisualPhase(0);


    try {


      const payload: { description?: string; presetId?: string } = {};

      if (trimmed.length > 0)

        payload.description = trimmed;



      if (presetId !== undefined)

        payload.presetId = presetId;


      const res = await fetch(`${base}/v1/demo/quickstart`, {


        method: "POST",

        credentials: "omit",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(payload),


      });

      const text = await res.text();

      if (!res.ok)

        throw new Error(text.length > 0 ? text : `Quick-start HTTP ${String(res.status)}`);


      const data = JSON.parse(text) as QuickStartApiResponse;



      setResult(data);

      setVisualPhase(2);

    }

    catch (e: unknown) {



      const msg = e instanceof Error && e.message.trim().length > 0 ? e.message : "Quick-start failed.";

      setError(msg);

    }

    finally {

      stopTicker();


      setSubmitting(false);

    }

  }, [description, presetId, stopTicker]);


  function renderPhaseDots(): ReactElement {

    return (




      <ol className="space-y-2">

        {PHASE_LABELS.map((label, index) => {


          const dotClass =
            result !== null
              ? "inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"


              : submitting && index < visualPhase

                ? "inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"


                : submitting && index === visualPhase

                  ? "inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"

                  : "inline-flex h-3 w-3 rounded-full border border-neutral-400 dark:border-neutral-600";

          return (
            <li key={label} className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
              <span className={dotClass} aria-hidden />
              <span className="text-sm">{label}</span>
            </li>
          );


        })}

      </ol>

    );

  }

  return (

    <div className="mx-auto max-w-xl space-y-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Quick start
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Simulator-only architecture pass — no sign-in. Opens the full operator run when finished.
        </p>
      </header>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="qs-desc">
          Architecture description
        </label>
        <textarea
          id="qs-desc"
          value={description}
          onChange={(ev) => {


            setDescription(ev.target.value);

          }}
          rows={5}
          className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
          placeholder="Three-tier web application on Azure with redundancy and private networking…"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((id) => (

            <button
              key={id}
              type="button"
              onClick={() => {


                selectPreset(id);

              }}

              className={
                presetId === id
                  ? "rounded-full border border-sky-600 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100"
                  : "rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"

              }
            >
              {id.replaceAll("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"

        disabled={submitting || (!description.trim() && presetId === undefined)}

        onClick={() => {


          void onSubmit();

        }}
        className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-sky-500 dark:hover:bg-sky-600"
      >
        {submitting ? "Running…" : "Run simulator quick-start"}

      </button>

      {(submitting || result !== null) && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
          {renderPhaseDots()}
        </div>
      )}

      {error !== null && (

        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      )}

      {result !== null && (

        <section className="space-y-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Top findings</h2>


          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {result.topFindings.slice(0, 3).map((finding) => (

              <li key={`${finding.title}:${finding.severity}`} className="py-2 text-sm">

                <div className="font-medium text-neutral-900 dark:text-neutral-50">{finding.title}</div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400">{finding.severity}</div>

              </li>

            ))}


          </ul>

          {isAbsoluteHttpHttpsUrl(result.runDetailUrl) ? (

            <a

              href={result.runDetailUrl}

              className="inline-block text-sm font-semibold text-sky-700 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
              rel="noopener noreferrer"

              target="_blank"
            >
              View full results
            </a>

          ) : (

            <Link

              href={result.runDetailUrl}

              className="inline-block text-sm font-semibold text-sky-700 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
            >
              View full results
            </Link>

          )}
        </section>
      )}
    </div>


  );


}
