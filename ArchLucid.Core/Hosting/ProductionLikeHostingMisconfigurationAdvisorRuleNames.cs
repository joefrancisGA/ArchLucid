namespace ArchLucid.Core.Hosting;

/// <summary>
/// Stable <c>rule_name</c> labels for <see cref="ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.RecordStartupConfigWarning"/> (TB-002).
/// </summary>
public static class ProductionLikeHostingMisconfigurationAdvisorRuleNames
{
    /// <summary>API host lacks CORS origins on staging/production-like.</summary>
    public const string CorsAllowedOriginsEmptyProductionLikeHost = "cors_allowed_origins_empty_production_like_host";

    /// <summary>JwtBearer configured without Authority or PEM path.</summary>
    public const string JwtBearerMissingAuthorityAndPem = "jwt_bearer_missing_authority_and_pem";

    /// <summary>ArchLucidAuth Mode is ApiKey but API keys disabled.</summary>
    public const string ApiKeyModeDisabledWhenConfigured = "api_key_mode_disabled_when_api_key_auth_configured";

    /// <summary><c>Authentication:ApiKey:DevelopmentBypassAll</c> set under production-profile validation.</summary>
    public const string AuthenticationApiKeyDevelopmentBypassAllDisallowed =
        "authentication_api_key_development_bypass_all_disallowed";

    /// <summary><c>ArchLucid:Persistence:AllowRlsBypass=true</c> under production-profile validation.</summary>
    public const string PersistenceAllowRlsBypassDisallowed = "persistence_allow_rls_bypass_disallowed";

    /// <summary>Real LLM mode without prompt deny-list redaction under production-profile validation.</summary>
    public const string LlmPromptRedactionRequiredForRealMode = "llm_prompt_redaction_required_for_real_mode";

    /// <summary><c>ProductionValidation:RequireTelemetryExport</c> enabled but no exporter configured.</summary>
    public const string TelemetryExportRequiredMissing = "telemetry_export_required_but_not_configured";

    /// <summary>Unrecognized <c>ArchLucidAuth:Mode</c> under production-profile validation.</summary>
    public const string AuthModeUnrecognized = "auth_mode_unrecognized_production_profile";

    /// <summary><c>ArchLucidAuth:Mode=DevelopmentBypass</c> under production-profile validation.</summary>
    public const string AuthModeDevelopmentBypassDisallowed = "auth_mode_development_bypass_disallowed";

    /// <summary>Local JWT PEM validation path disallowed when ASP.NET Production or <c>ARCHLUCID_ENVIRONMENT=Production</c>.</summary>
    public const string JwtBearerLocalPemDisallowedProductionProfile = "jwt_bearer_local_pem_disallowed_production_profile";
}
