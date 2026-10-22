export type ConfigLintFindingPayload = {
  readonly ruleName?: string;
  readonly message?: string;
};

export type ConfigLintPayload = {
  readonly hostingEnvironmentName?: string;
  readonly blockingFindings?: readonly ConfigLintFindingPayload[];
  readonly advisoryFindings?: readonly ConfigLintFindingPayload[];
};

export type PresentedConfigLintFinding = {
  readonly ruleId: string;
  readonly title: string;
  readonly message: string;
  readonly recommendedAction: string | null;
};

const CONFIG_LINT_GUIDANCE: Readonly<
  Record<string, { readonly title: string; readonly recommendedAction: string }>
> = {
  graph_rag_enabled_without_azure_search_posture: {
    title: "Retrieval graph expansion is enabled without Azure AI Search",
    recommendedAction:
      "Provision Azure AI Search for vector retrieval, or disable graph expansion until Search is ready.",
  },
  azure_ai_search_vector_index_required_production_like: {
    title: "Production hosting requires Azure AI Search for retrieval",
    recommendedAction: "Configure Retrieval:VectorIndex=AzureSearch and provision the search service.",
  },
  azure_ai_search_endpoint_required_production_like: {
    title: "Azure AI Search endpoint is missing",
    recommendedAction: "Add the Search service URL and credentials before sponsor handoff.",
  },
  telemetry_export_required_but_not_configured: {
    title: "Telemetry export is not configured",
    recommendedAction: "Enable Application Insights, OTLP, or Prometheus export for operational visibility.",
  },
  quality_gate_warn_only_in_real_production_like: {
    title: "Agent quality gate is warn-only in real execution mode",
    recommendedAction: "Tighten quality gate thresholds or use simulator mode until strict AI quality checks are configured.",
  },
  cors_allowed_origins_empty_production_like_host: {
    title: "Browser CORS origins are not configured",
    recommendedAction: "Set allowed operator UI origins for this hosted environment.",
  },
  jwt_bearer_missing_authority_and_pem: {
    title: "Sign-in authority is not fully configured",
    recommendedAction: "Configure OIDC authority or a supported JWT validation path for hosted sign-in.",
  },
};

function humanizeRuleName(ruleName: string): string {
  return ruleName
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function presentConfigLintFinding(
  ruleName: string | undefined,
  message: string | undefined,
): PresentedConfigLintFinding {
  const ruleId = (ruleName ?? "finding").trim();
  const guidance = CONFIG_LINT_GUIDANCE[ruleId];
  const safeMessage = (message ?? "").trim();

  return {
    ruleId,
    title: guidance?.title ?? humanizeRuleName(ruleId),
    message: safeMessage.length > 0 ? safeMessage : "Configuration advisory reported by environment lint.",
    recommendedAction: guidance?.recommendedAction ?? null,
  };
}

export function presentConfigLintFindings(
  payload: ConfigLintPayload | null,
): {
  readonly blocking: readonly PresentedConfigLintFinding[];
  readonly advisory: readonly PresentedConfigLintFinding[];
} {
  if (payload === null) {
    return { blocking: [], advisory: [] };
  }

  const blocking = (payload.blockingFindings ?? []).map((finding) =>
    presentConfigLintFinding(finding.ruleName, finding.message),
  );
  const advisory = (payload.advisoryFindings ?? []).map((finding) =>
    presentConfigLintFinding(finding.ruleName, finding.message),
  );

  return { blocking, advisory };
}
