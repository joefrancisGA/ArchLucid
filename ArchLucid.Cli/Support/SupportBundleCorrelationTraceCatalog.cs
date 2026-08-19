namespace ArchLucid.Cli.Support;

/// <summary>
///     Stable correlation / trace bullets duplicated into <see cref="SupportBundleReferencesSection" /> for machine checks.
/// </summary>
public static class SupportBundleCorrelationTraceCatalog
{
    public static IReadOnlyList<string> GuidanceBullets { get; } =
    [
        "Match API responses to logs with header X-Correlation-ID or problem JSON correlationId (same value).",
        "Per-run diagnostics: archlucid trace <runId> prints the persisted OpenTelemetry trace id (configure ARCHLUCID_TRACE_VIEWER_URL_TEMPLATE for a deep link).",
        "Review health.json and build.json first; version + health JSON narrow most first-pilot failures before log diving."
    ];
}
