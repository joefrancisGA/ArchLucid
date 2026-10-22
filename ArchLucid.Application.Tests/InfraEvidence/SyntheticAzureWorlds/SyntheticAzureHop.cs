using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

internal sealed class SyntheticAzureHop
{
    public required string FromNodeId { get; init; }

    public required string ToNodeId { get; init; }

    public required string EdgeType { get; init; }

    public required ProvenanceKind ProvenanceKind { get; init; }

    public required PathConfidenceBand ConfidenceBand { get; init; }

    public required string EvidenceReference { get; init; }

    public Guid? CloudResourceId { get; init; }

    public string? InferenceSource { get; init; }
}
