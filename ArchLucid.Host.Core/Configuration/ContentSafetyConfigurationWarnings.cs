using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Host.Core.Configuration;

/// <summary>
/// Logs when production-like hosts carry <c>ArchLucid:ContentSafety:FailClosedOnSdkError=false</c> in merged
/// configuration. Runtime options still fail closed via
/// <see cref="ArchLucid.Host.Core.Startup.ContentSafetyProductionLikePostConfigure" />;
/// this advisory reduces operator confusion when optional JSON (for example <c>appsettings.Advanced.json</c>) overrides
/// environment appsettings.
/// </summary>
public static class ContentSafetyConfigurationWarnings
{
    /// <summary>
    /// Emits a single warning when the effective configuration sets fail-open SDK handling while the host is classified
    /// as production or staging (including <c>ARCHLUCID_ENVIRONMENT</c>).
    /// </summary>
    public static void LogIfProductionLikeFailOpenSdkSettingIsIgnored(
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(logger);

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
            return;

        bool? failClosed = configuration.GetValue<bool?>("ArchLucid:ContentSafety:FailClosedOnSdkError");

        if (failClosed is not false)
            return;

        logger.LogWarning(
            "ArchLucid:ContentSafety:FailClosedOnSdkError is false in configuration, but Production, Staging, or ARCHLUCID_ENVIRONMENT=Production|Staging hosts always use fail-closed Azure Content Safety SDK behavior. "
            + "The value is overridden at runtime. Remove the key or set it to true so configuration matches runtime; see docs/library/SECURITY.md.");

        ArchLucidInstrumentation.RecordStartupConfigWarning(
            ContentSafetyStartupWarningRuleNames.ProductionLikeFailClosedOnSdkSettingOverridden);
    }
}
