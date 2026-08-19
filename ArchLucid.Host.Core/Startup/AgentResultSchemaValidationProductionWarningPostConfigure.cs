using ArchLucid.AgentRuntime;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Startup advisory when agent result schema enforcement is disabled on production-like hosts.</summary>
public sealed class AgentResultSchemaValidationProductionWarningPostConfigure(
    IHostEnvironment hostEnvironment,
    IConfiguration configuration,
    ILogger<AgentResultSchemaValidationProductionWarningPostConfigure> logger)
    : IPostConfigureOptions<AgentResultSchemaValidationOptions>
{
    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<AgentResultSchemaValidationProductionWarningPostConfigure> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public void PostConfigure(string? name, AgentResultSchemaValidationOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.EnforceOnParse)
            return;

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(_hostEnvironment, _configuration))
            return;

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(
                "AgentExecution:SchemaValidation:EnforceOnParse=false on a production-like host; invalid AgentResult JSON may be parsed with warnings instead of failing fast.");

        ArchLucidInstrumentation.RecordStartupConfigWarning(
            StartupValidationWarningRuleNames.AgentResultSchemaEnforceOnParseDisabledProductionLike);
    }
}
