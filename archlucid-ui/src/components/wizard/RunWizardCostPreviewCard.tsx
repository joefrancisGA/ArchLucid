"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { useAgentExecutionCostPreviewQuery } from "@/hooks/use-wizard-advanced-queries";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export type AgentExecutionCostPreviewPayload = {
  mode: string;
  maxCompletionTokens: number;
  estimatedCostUsd: number | null;
  estimatedCostUsdLow: number | null;
  estimatedCostUsdHigh: number | null;
  estimatedCostBasis: string;
  pricingUsesIllustrativeUsdRates: boolean;
  deploymentName: string | null;
};

const DOCS_URL = resolveInAppDocHref("docs/deployment/PER_TENANT_COST_MODEL.md");

export type RunWizardCostPreviewCardProps = {
  /** Defaults to same-origin BFF proxy path. */
  previewUrl?: string;
};

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Host-level AOAI cost preview for the review step; hidden when API reports Simulator mode.
 */
export function RunWizardCostPreviewCard(props: RunWizardCostPreviewCardProps = {}) {
  const previewUrl = props.previewUrl ?? "/api/proxy/v1/agent-execution/cost-preview";
  const { data, isError, error: queryError } = useAgentExecutionCostPreviewQuery(previewUrl);
  const error = isError
    ? (queryError instanceof Error ? queryError.message : "Preview unavailable")
    : null;

  if (error !== null) {
    return (
      <div
        role="status"
        data-testid="run-cost-preview-error"
        className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
      >
        {error}
      </div>
    );
  }

  if (data === null) {
    return (
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} data-testid="run-cost-preview-loading">
        Loading cost preview…
      </p>
    );
  }

  if (data.mode !== "Real") {
    return null;
  }

  const low = data.estimatedCostUsdLow;
  const high = data.estimatedCostUsdHigh ?? data.estimatedCostUsd;
  const hasBand =
    typeof low === "number" &&
    !Number.isNaN(low) &&
    typeof high === "number" &&
    !Number.isNaN(high);

  const bandLabel = hasBand ? `${formatUsd(low)}–${formatUsd(high)}` : null;

  const headlineAmount =
    bandLabel ??
    (typeof high === "number" && !Number.isNaN(high) ? formatUsd(high) : null);

  return (
    <div
      data-testid="run-cost-preview-card"
      className={cn(DESIGN_TOKENS.callout.warn, "p-4 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-medium" data-testid="run-cost-preview-headline">
        Estimated Azure OpenAI cost for this review:{" "}
        {headlineAmount !== null ? (
          <span data-testid="run-cost-preview-amount">{headlineAmount}</span>
        ) : (
          <span data-testid="run-cost-preview-amount">—</span>
        )}{" "}
        (band: low = small assumed prompt, high = four parallel agents at configured token ceiling;{" "}
        <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>MaxCompletionTokens</code>
        ={data.maxCompletionTokens})
        {data.deploymentName ? (
          <>
            {" "}
            · deployment <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{data.deploymentName}</code>
          </>
        ) : null}
      </p>
      {data.pricingUsesIllustrativeUsdRates ? (
        <p className={cn("mt-2 mb-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          Illustrative USD rates are still set from defaults — override{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">AgentExecution:LlmCostEstimation</code> to match
          your deployment&apos;s list price.
        </p>
      ) : null}
      <p className={cn("mt-2 mb-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{data.estimatedCostBasis}</p>
      <p className={cn("mt-2 mb-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Methodology:{" "}
        <Link className={OPERATOR_LINK.inline} href={DOCS_URL}>
          docs/deployment/PER_TENANT_COST_MODEL.md
        </Link>
      </p>
    </div>
  );
}
