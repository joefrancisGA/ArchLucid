namespace ArchLucid.Cli.Commands;

using ArchLucid.Core.Hosting;

/// <summary>
///     Operator remediation metadata for production-like config lint findings — no secrets, config keys only.
/// </summary>
internal static class ConfigLintFindingGuidance
{
    internal sealed record Guidance(
        string WhyItMatters,
        string ConfigKeys,
        string RemediationHint,
        string ExpectedProofArtifact);

    internal static Guidance? TryResolve(string ruleName)
    {
        if (string.IsNullOrWhiteSpace(ruleName))
            return null;

        return ruleName switch
        {
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed =>
                new Guidance(
                    "DevelopmentBypass auth must not ship on hosted pilot or production-like hosts.",
                    "ArchLucidAuth:Mode; ASPNETCORE_ENVIRONMENT; ARCHLUCID_ENVIRONMENT",
                    "Set ArchLucidAuth:Mode to ApiKey or JwtBearer and configure real identity before sponsor handoff.",
                    "config-lint-production-like-hosted-pilot.json · go-no-go-summary.md"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthenticationApiKeyDevelopmentBypassAllDisallowed =>
                new Guidance(
                    "Global API-key bypass removes tenant auth posture required for enterprise pilots.",
                    "Authentication:ApiKey:DevelopmentBypassAll",
                    "Set Authentication:ApiKey:DevelopmentBypassAll=false and use scoped API keys or JWT.",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerMissingAuthorityAndPem =>
                new Guidance(
                    "JwtBearer mode without Authority or PEM cannot validate tokens on a hosted pilot.",
                    "ArchLucidAuth:Mode; ArchLucidAuth:Authority; ArchLucidAuth:JwtSigningPublicKeyPemPath",
                    "Configure OIDC Authority (preferred) or a CI-only PEM path for non-production hosts.",
                    "config-lint-production-like-hosted-pilot.json · archlucid auth diagnostics"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerLocalPemDisallowedProductionProfile =>
                new Guidance(
                    "Local PEM JWT validation is not allowed when the host is production-named.",
                    "ArchLucidAuth:JwtSigningPublicKeyPemPath; ASPNETCORE_ENVIRONMENT; ARCHLUCID_ENVIRONMENT",
                    "Remove local PEM validation and configure OIDC Authority for hosted pilots.",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.ApiKeyModeDisabledWhenConfigured =>
                new Guidance(
                    "When ArchLucidAuth:Mode is ApiKey, the Authentication section API-key Enabled setting must be true.",
                    "ArchLucidAuth:Mode; Authentication section (API key Enabled)",
                    "Enable API key authentication or switch ArchLucidAuth:Mode to JwtBearer.",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.LlmPromptRedactionRequiredForRealMode =>
                new Guidance(
                    "Real-mode LLM calls without prompt redaction can leak sensitive architecture text to the model provider.",
                    "LlmPromptRedaction:*; AzureOpenAI / real LLM endpoint keys",
                    "Enable prompt deny-list redaction before enabling real Azure OpenAI on hosted pilots.",
                    "config-lint-production-like-hosted-pilot.json · ai-quality-proof row"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.TelemetryExportRequiredMissing =>
                new Guidance(
                    "Hosted pilots need durable telemetry export for support and availability evidence.",
                    "ProductionValidation:RequireTelemetryExport; ApplicationInsights / OTLP / Prometheus exporters",
                    "Configure Application Insights, OTLP, or Prometheus export and rerun observability export readiness.",
                    "observability-export-readiness.md · config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchVectorIndexRequiredProductionLike =>
                new Guidance(
                    "Production-like hosts must use tenant-scoped Azure AI Search for RAG — not in-memory vector index.",
                    "Retrieval:VectorIndex; Retrieval:AzureSearch:Endpoint; Retrieval:AzureSearch:IndexName",
                    "Set Retrieval:VectorIndex=AzureSearch and provision Search per CONFIGURATION_REFERENCE.md (owner 2026-05-29).",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchEndpointRequiredProductionLike =>
                new Guidance(
                    "Azure AI Search endpoint is required whenever production-like hosting uses VectorIndex=AzureSearch.",
                    "Retrieval:AzureSearch:Endpoint; Retrieval:AzureSearch:IndexName; Retrieval:AzureSearch:ApiKey",
                    "Configure the Search service URL and credentials (prefer Key Vault references) before sponsor handoff.",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike =>
                new Guidance(
                    "Real-mode hosted pilots with WarnOnly quality gate can pass low-quality agent output to sponsor proof.",
                    "AgentExecution:Mode; ArchLucid:AgentOutput:QualityGate:Mode; ArchLucid:AgentOutput:QualityGate:EnforceOnReject; ArchLucid:AgentOutput:QualityGate:BlockRunOnReject",
                    "Set Mode=PilotStrict with faithfulness floors on production-like hosts, or stay on Simulator until PilotStrict is configured.",
                    "config-lint-production-like-hosted-pilot.json · go-no-go-summary.md"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.CorsAllowedOriginsEmptyProductionLikeHost =>
                new Guidance(
                    "Browser clients on staging/production-like hosts need explicit CORS origins.",
                    "Cors:AllowedOrigins",
                    "Set Cors:AllowedOrigins to the operator UI origin(s) for the hosted pilot.",
                    "config-lint-production-like-hosted-pilot.json"),

            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeUnrecognized =>
                new Guidance(
                    "Unrecognized auth mode prevents predictable enterprise login posture.",
                    "ArchLucidAuth:Mode",
                    "Set ArchLucidAuth:Mode to ApiKey, JwtBearer, or DevelopmentBypass (local only).",
                    "config-lint-production-like-hosted-pilot.json"),

            AzureOpenAiEndpointConnectivityLintAdvisor.UnreachableRuleName =>
                new Guidance(
                    "Configured Azure OpenAI endpoint is unreachable from the host running the pilot.",
                    "AzureOpenAI endpoint / connection settings",
                    "Verify network, DNS, private endpoint, and firewall rules; rerun config lint after fix.",
                    "config-lint-production-like-hosted-pilot.json · pilot preflight"),

            AzureOpenAiEndpointConnectivityLintAdvisor.InvalidUrlRuleName =>
                new Guidance(
                    "Azure OpenAI endpoint URL is malformed or missing required segments.",
                    "AzureOpenAI endpoint URL settings",
                    "Correct the endpoint URL and rerun config lint.",
                    "config-lint-production-like-hosted-pilot.json"),

            "ArchLucidAuthModeProductionLikeRequirement" =>
                new Guidance(
                    "DevelopmentBypass auth must not ship on hosted pilot or production-like hosts.",
                    "ArchLucidAuth:Mode; ASPNETCORE_ENVIRONMENT; ARCHLUCID_ENVIRONMENT",
                    "Set ArchLucidAuth:Mode to ApiKey or JwtBearer and configure real identity before sponsor handoff.",
                    "config-lint-production-like-hosted-pilot.json · go-no-go-summary.md"),

            _ => null,
        };
    }
}
