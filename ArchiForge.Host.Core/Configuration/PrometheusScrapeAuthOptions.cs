namespace ArchiForge.Host.Core.Configuration;

/// <summary>Binding for <c>Observability:Prometheus</c> scrape protection (basic auth on the metrics path).</summary>
public sealed class PrometheusScrapeAuthOptions
{
    public const string SectionPath = "Observability:Prometheus";

    /// <summary>HTTP path served by the OpenTelemetry Prometheus exporter (default aligns with OTel conventions).</summary>
    public string ScrapePath { get; set; } = "/metrics";

    /// <summary>When true (default), startup validation requires scrape credentials whenever Prometheus is enabled.</summary>
    public bool RequireScrapeAuthentication { get; set; } = true;

    public string? ScrapeUsername { get; set; }

    public string? ScrapePassword { get; set; }
}
