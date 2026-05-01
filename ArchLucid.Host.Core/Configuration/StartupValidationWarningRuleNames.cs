namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     Bounded <c>rule_name</c> labels for
///     <see cref="ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.RecordStartupConfigWarning" /> (TECH_BACKLOG TB-002).
/// </summary>
public static class StartupValidationWarningRuleNames
{
    public const string DevelopmentBypassAuthModeActive = "development_bypass_auth_mode_active";

    public const string LlmPromptRedactionDisabledProductionLike = "llm_prompt_redaction_disabled_production_like";

    public const string RlsBreakGlassEnabled = "rls_break_glass_enabled";

    public const string SqlConnectionStringMissingSkipMigrations = "sql_connection_string_missing_skip_migrations";
}
