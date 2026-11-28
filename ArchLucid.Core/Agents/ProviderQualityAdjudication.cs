namespace ArchLucid.Core.Agents;

public sealed record ProviderQualityAdjudication(
    string SampleId,
    ProviderQualityKey Key,
    ProviderQualityLabel Label,
    int SeverityWeight,
    bool Independent,
    string AdjudicatorKind,
    DateTimeOffset ObservedUtc,
    string? TraceId = null);
