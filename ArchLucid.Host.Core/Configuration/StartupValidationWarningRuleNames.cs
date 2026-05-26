namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     Bounded <c>rule_name</c> labels for
///     <see cref="ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.RecordStartupConfigWarning" /> (TECH_BACKLOG TB-002).
/// </summary>
public static class StartupValidationWarningRuleNames
{
    public const string DevelopmentBypassAuthModeActive = "development_bypass_auth_mode_active";

    public const string LlmPromptRedactionDisabledProductionLike = "llm_prompt_redaction_disabled_production_like";

    public const string AgentResultSchemaEnforceOnParseDisabledProductionLike =
        "agent_result_schema_enforce_on_parse_disabled_production_like";

    public const string SqlConnectionStringMissingSkipMigrations = "sql_connection_string_missing_skip_migrations";

    public const string RetrievalTelemetryPerTenantTagsProductionLike =
        "retrieval_telemetry_per_tenant_tags_production_like";

    public const string OidcAuthorityUnreachable = "oidc_authority_unreachable";

    public const string SamlSigningCertificateExpiringSoon = "saml_signing_certificate_expiring_soon";

    public const string LlmCostEstimationNonPositiveGlobalRate = "llm_cost_estimation_non_positive_global_rate";

    public const string LlmCostEstimationNonPositiveDeploymentRate =
        "llm_cost_estimation_non_positive_deployment_rate";
}
