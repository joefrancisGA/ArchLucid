using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Normalized manifest fields shared by AWS and GCP inventory ZIP packages.</summary>
public sealed record CloudInventoryExtractorNormalizedManifest(
    int SchemaVersion,
    string ScriptVersion,
    DateTimeOffset CollectionTimestamp,
    CloudProvider CloudProvider,
    string ScopeId,
    string Scope,
    string[] SwitchesUsed,
    string CollectorVersion,
    string RawJson);
