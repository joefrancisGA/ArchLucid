namespace ArchLucid.Core.Costing;

/// <summary>Artifact-facing snapshot of infra USD estimates (topology or extractor-fed).</summary>
public sealed record InfrastructureCostArtifactAugmentation(
    decimal? InferredUsdPerMonth,
    IReadOnlyList<InfrastructureCostLine> Lines,
    string SummaryNote);
