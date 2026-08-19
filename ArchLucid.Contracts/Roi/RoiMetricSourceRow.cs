namespace ArchLucid.Contracts.Roi;

/// <summary>One sponsor-visible ROI/cost metric with explicit source metadata.</summary>
public sealed record RoiMetricSourceRow(
    string MetricKey,
    string DisplayLabel,
    string ValueSummary,
    RoiMetricSourceKind SourceKind,
    string CitationDetail);
