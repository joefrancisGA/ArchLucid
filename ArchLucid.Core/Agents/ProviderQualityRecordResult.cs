namespace ArchLucid.Core.Agents;

public sealed record ProviderQualityRecordResult(
    ProviderQualitySnapshot Snapshot,
    bool StateChanged,
    string? Transition);
