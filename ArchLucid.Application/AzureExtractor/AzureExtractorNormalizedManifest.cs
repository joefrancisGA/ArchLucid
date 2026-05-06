namespace ArchLucid.Application.AzureExtractor;

/// <summary>Parsed fields from extractor <c>manifest.json</c> used for persistence and citations.</summary>
public sealed record AzureExtractorNormalizedManifest(
    int SchemaVersion,
    string ScriptVersion,
    DateTimeOffset CollectionTimestamp,
    string SubscriptionId,
    string ScopeDescriptor,
    IReadOnlyList<string> SwitchesUsed,
    string AzModuleVersion,
    string RawJson);
