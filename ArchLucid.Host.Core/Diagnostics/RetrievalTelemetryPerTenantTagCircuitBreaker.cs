using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>
///     Drops high-cardinality <c>tenant_id</c> RAG metric tags when configured tenant estimates exceed the safe
///     threshold paired with <see cref="StartupValidationWarningRuleNames.RetrievalTelemetryPerTenantTagsProductionLike" />.
/// </summary>
public sealed class RetrievalTelemetryPerTenantTagCircuitBreaker(IOptionsMonitor<RetrievalTelemetryOptions> optionsMonitor)
{
    private readonly IOptionsMonitor<RetrievalTelemetryOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <summary>
    ///     Returns <see langword="true" /> when per-tenant RAG tags must be suppressed to protect the metrics backend.
    /// </summary>
    public bool ShouldSuppressTenantIdTags()
    {
        RetrievalTelemetryOptions options = _optionsMonitor.CurrentValue;

        if (!options.RecordPerTenantTags)
            return false;

        if (options.EstimatedTenantCount <= 0)
            return false;

        return options.EstimatedTenantCount > options.MaxRecommendedTenantCountForPerTenantTags;
    }
}
