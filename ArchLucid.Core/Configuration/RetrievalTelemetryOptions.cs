namespace ArchLucid.Core.Configuration;

/// <summary>Optional high-cardinality RAG retrieval metrics (tenant id label). Use only when tenant count is bounded.</summary>
public sealed class RetrievalTelemetryOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "RetrievalTelemetry";

    /// <summary>
    ///     When true, RAG duration/chunk histograms also emit with <c>tenant_id</c> tag (in addition to aggregate series
    ///     without tenant).
    /// </summary>
    public bool RecordPerTenantTags
    {
        get;
        set;
    }

    /// <summary>
    ///     Optional operator estimate of active tenants; used for startup cardinality advisory when
    ///     <see cref="RecordPerTenantTags" /> is enabled on production-like hosts.
    /// </summary>
    public int EstimatedTenantCount
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see cref="RecordPerTenantTags" /> is true and <see cref="EstimatedTenantCount" /> exceeds this value on
    ///     production-like hosts, startup emits <c>archlucid_startup_config_warnings_total</c>.
    /// </summary>
    public int MaxRecommendedTenantCountForPerTenantTags
    {
        get;
        set;
    } = 100;
}
