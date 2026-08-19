using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Emits a startup warning when per-tenant RAG telemetry tags are enabled on production-like hosts.</summary>
public sealed class RetrievalTelemetryProductionWarningPostConfigure(
    IHostEnvironment hostEnvironment,
    IConfiguration configuration,
    ILogger<RetrievalTelemetryProductionWarningPostConfigure> logger)
    : IPostConfigureOptions<RetrievalTelemetryOptions>
{
    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<RetrievalTelemetryProductionWarningPostConfigure> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public void PostConfigure(string? name, RetrievalTelemetryOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.RecordPerTenantTags)
            return;

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(_hostEnvironment, _configuration))
            return;

        int maxRecommended = Math.Max(1, options.MaxRecommendedTenantCountForPerTenantTags);
        int estimatedTenants = Math.Max(0, options.EstimatedTenantCount);
        bool exceedsRecommendedEstimate = estimatedTenants > maxRecommended;

        if (!exceedsRecommendedEstimate)
            return;

        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                "RetrievalTelemetry:RecordPerTenantTags=true on a production-like host with EstimatedTenantCount={EstimatedTenantCount} (recommended max {MaxRecommended}). RAG Prometheus series will include tenant_id labels and may raise ingest cost.",
                estimatedTenants,
                maxRecommended);

        ArchLucidInstrumentation.RecordStartupConfigWarning(
            StartupValidationWarningRuleNames.RetrievalTelemetryPerTenantTagsProductionLike);
    }
}
