"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseConnectorIntake } from "@/lib/api/architecture-connector-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { mergeConnectorIntakeIntoWizardValues } from "@/lib/connector-intake-to-wizard";
import { useWizardAiSuggestedFields } from "@/lib/wizard-ai-suggested-fields";
import { firstWhyDisabledCtaReason, whyDisabledBusy, whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  connectorIntakeTabHrefFromSearch,
  parseConnectorIntakeTabFromSearch,
  type ConnectorIntakeTabId,
} from "@/lib/runs/connector-intake-tab-url";

export type ConnectorIntakePanelProps = {
  readonly onParsed?: () => void;
};

type ConnectorTab = ConnectorIntakeTabId;

export function ConnectorIntakePanel(props: ConnectorIntakePanelProps) {
  const { onParsed } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const urlTab = parseConnectorIntakeTabFromSearch(searchParams.get("intake"));
  const { getValues, reset, clearErrors } = useFormContext<WizardFormValues>();
  const { markAiSuggested } = useWizardAiSuggestedFields();
  const [tab, setTabState] = useState<ConnectorTab>(urlTab ?? "terraform");
  const [terraformJson, setTerraformJson] = useState("");
  const [gitRepositoryUrl, setGitRepositoryUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitTerraformPath, setGitTerraformPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setTab = useCallback(
    (next: ConnectorTab) => {
      setTabState(next);
      router.replace(connectorIntakeTabHrefFromSearch(searchParams.toString(), next, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const nextTab = parseConnectorIntakeTabFromSearch(searchParams.get("intake"));

    if (nextTab !== null) {
      setTabState(nextTab);
    }
  }, [searchParams]);

  async function onImport(): Promise<void> {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = await parseConnectorIntake(
        tab === "terraform"
          ? {
              source: "terraform-show-json",
              terraformShowJson: terraformJson.trim(),
            }
          : {
              source: "git-terraform",
              gitRepositoryUrl: gitRepositoryUrl.trim(),
              gitBranch: gitBranch.trim(),
              gitTerraformPath: gitTerraformPath.trim(),
            },
      );

      const merged = mergeConnectorIntakeIntoWizardValues(getValues(), parsed);
      clearErrors();
      reset(merged, { keepDefaultValues: false });
      markAiSuggested("topologyHints", merged.topologyHints ?? []);
      markAiSuggested("constraints", merged.constraints ?? []);
      setSuccess("Imported infrastructure into the wizard — review fields before submitting.");
      onParsed?.();
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not import infrastructure.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const canImport =
    tab === "terraform" ? terraformJson.trim().length >= 20 : gitRepositoryUrl.trim().length > 0 && gitTerraformPath.trim().length > 0;
  const importDisabledReason = firstWhyDisabledCtaReason([
    busy ? whyDisabledBusy("Import") : null,
    !canImport
      ? whyDisabledIncompleteInput(
          tab === "terraform"
            ? "Paste terraform show -json output to import."
            : "Enter repository URL and path to a .tf file to import.",
        )
      : null,
  ]);

  return (
    <div
      className="rounded-md border border-dashed border-neutral-300 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid="connector-intake-panel"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Import from Terraform or Git</p>
      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Paste <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">terraform show -json</code> output or
        point at a public GitHub <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">.tf</code> file.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={tab === "terraform" ? "default" : "secondary"} onClick={() => setTab("terraform")}>
          Terraform state
        </Button>
        <Button type="button" size="sm" variant={tab === "git" ? "default" : "secondary"} onClick={() => setTab("git")}>
          Git repository
        </Button>
      </div>
      {tab === "terraform" ? (
        <Textarea
          className={cn("mt-3 font-mono", OPERATOR_TYPOGRAPHY.helper)}
          rows={8}
          value={terraformJson}
          onChange={(e) => setTerraformJson(e.target.value)}
          disabled={busy}
          placeholder='Paste output from: terraform show -json'
          data-testid="connector-intake-terraform-json"
        />
      ) : (
        <div className="mt-3 grid gap-2">
          <Input
            value={gitRepositoryUrl}
            onChange={(e) => setGitRepositoryUrl(e.target.value)}
            disabled={busy}
            placeholder="https://github.com/org/repo"
            data-testid="connector-intake-git-url"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={gitBranch}
              onChange={(e) => setGitBranch(e.target.value)}
              disabled={busy}
              placeholder="Branch (main)"
              data-testid="connector-intake-git-branch"
            />
            <Input
              value={gitTerraformPath}
              onChange={(e) => setGitTerraformPath(e.target.value)}
              disabled={busy}
              placeholder="Path to .tf file (infra/main.tf)"
              data-testid="connector-intake-git-path"
            />
          </div>
        </div>
      )}
      <div className="mt-3">
        <Button type="button" size="sm" disabled={!canImport || busy} onClick={() => void onImport()} data-testid="connector-intake-import-button">
          {busy ? "Importing…" : "Import infrastructure"}
        </Button>
        <WhyDisabledCtaHint reason={!canImport || busy ? importDisabledReason : null} />
      </div>
      {error !== null ? (
        <div className="mt-3" role="alert">
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
          />
        </div>
      ) : null}
      {success !== null ? (
        <p className={cn("mt-3 text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="connector-intake-success">
          {success}
        </p>
      ) : null}
    </div>
  );
}
