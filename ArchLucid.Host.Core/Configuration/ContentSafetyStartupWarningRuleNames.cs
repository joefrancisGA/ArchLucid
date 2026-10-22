namespace ArchLucid.Host.Core.Configuration;

/// <summary>Telemetry rule names for <see cref="ContentSafetyConfigurationWarnings" /> (TB-002 startup advisory).</summary>
public static class ContentSafetyStartupWarningRuleNames
{
    public const string ProductionLikeFailClosedOnSdkSettingOverridden =
        "content_safety_fail_closed_on_sdk_error_overridden_production_like";

    public const string AllowNullGuardOutsideDevelopmentOrSandbox =
        "content_safety_allow_null_guard_outside_development_or_sandbox";
}
