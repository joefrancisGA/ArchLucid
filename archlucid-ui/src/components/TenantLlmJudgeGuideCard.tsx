"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InAppHelpLink } from "@/components/InAppHelpLink";

/** Settings guidance for enabling LLM-as-judge (opt-in; budget impact). */
export function TenantLlmJudgeGuideCard(): React.JSX.Element {
  return (
    <Card data-testid="tenant-llm-judge-guide-card">
      <CardHeader>
        <CardTitle className="text-base">LLM-as-judge (advanced quality)</CardTitle>
        <CardDescription>
          Semantic evaluation beyond heuristic structural checks. Disabled by default to control LLM spend; enable when
          pilots need deeper automated oversight.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
        <p className="m-0">
          Host configuration key:{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">ArchLucid:Agents:LlmJudge:Enabled</code>
          . Daily token budget applies when enabled.
        </p>
        <p className="m-0">
          Pair with tenant quality-gate mode below — <strong>PilotStrict</strong> blocks runs on reject;{" "}
          <strong>WarnOnly</strong> surfaces warnings without halting the pipeline.
        </p>
        <InAppHelpLink helpSlug="configuration-reference" label="Configuration reference" variant="text" />
        {" · "}
        <Link href="/admin/fleet-llm-cogs" className="font-medium text-teal-800 underline dark:text-teal-300">
          Fleet LLM cost view
        </Link>
      </CardContent>
    </Card>
  );
}
