using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Startup;

/// <summary>
///     Emits a startup warning when <c>AllowNullGuardInDevelopment</c> is enabled outside Development or Sandbox hosts.
/// </summary>
public sealed class ContentSafetyAllowNullGuardProductionWarningPostConfigure(
    IHostEnvironment hostEnvironment,
    ILogger<ContentSafetyAllowNullGuardProductionWarningPostConfigure> logger)
    : IPostConfigureOptions<ContentSafetyOptions>
{
    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly ILogger<ContentSafetyAllowNullGuardProductionWarningPostConfigure> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public void PostConfigure(string? name, ContentSafetyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.Enabled || !options.AllowNullGuardInDevelopment)
            return;

        if (HostEnvironmentClassification.IsDevelopmentOrSandbox(_hostEnvironment))
            return;

        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                "ArchLucid:ContentSafety:AllowNullGuardInDevelopment is true while ArchLucid:ContentSafety:Enabled is false on host environment {EnvironmentName}. "
                + "Prompts are not screened by Azure Content Safety outside Development/Sandbox. Enable content safety or disable AllowNullGuardInDevelopment.",
                _hostEnvironment.EnvironmentName);

        ArchLucidInstrumentation.RecordStartupConfigWarning(
            ContentSafetyStartupWarningRuleNames.AllowNullGuardOutsideDevelopmentOrSandbox);
    }
}
