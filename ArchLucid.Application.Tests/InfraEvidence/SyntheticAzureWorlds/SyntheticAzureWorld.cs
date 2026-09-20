using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

internal sealed class SyntheticAzureWorld
{
    public required string Name { get; init; }

    public IReadOnlyList<SyntheticAzurePath> Paths { get; init; } = [];

    public IReadOnlyList<Guid> ExpectedRankOrder { get; init; } = [];

    public string? ExpectedTopCutKey { get; init; }

    public int? ExpectedTopCutCollapsedPathCount { get; init; }

    public IReadOnlyList<string> RequiredEvidenceReferences { get; init; } = [];

    public IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> Materialize(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid snapshotId)
    {
        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> materialized = [];

        foreach (SyntheticAzurePath syntheticPath in Paths)
        {
            List<SecurityEvidencePathHopRecord> hops = syntheticPath.Hops
                .Select((hop, index) => new SecurityEvidencePathHopRecord
                {
                    HopRowId = DeterministicGuid($"{Name}|{syntheticPath.PathId:D}|hop|{index + 1}"),
                    PathId = syntheticPath.PathId,
                    TenantId = tenantId,
                    HopOrdinal = index + 1,
                    FromNodeId = hop.FromNodeId,
                    ToNodeId = hop.ToNodeId,
                    EdgeType = hop.EdgeType,
                    ProvenanceKind = hop.ProvenanceKind,
                    HopConfidenceBand = hop.ConfidenceBand,
                    InferenceSource = hop.InferenceSource,
                    EvidenceReference = hop.EvidenceReference,
                    CloudResourceId = hop.CloudResourceId,
                })
                .ToList();

            SecurityEvidencePathRecord header = new()
            {
                PathId = syntheticPath.PathId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                SnapshotId = snapshotId,
                PathKind = syntheticPath.PathKind,
                PathConfidenceBand = syntheticPath.ConfidenceBand,
                CrownJewelAssertionId = syntheticPath.CrownJewelAssertionId,
                CreatedUtc = new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc),
                UpdatedUtc = new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc),
            };

            SecurityEvidencePathGuard.ValidatedPath validated =
                SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

            materialized.Add((validated.Path, validated.Hops.ToList()));
        }

        return materialized;
    }

    private static Guid DeterministicGuid(string value)
    {
        byte[] bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value));

        return new Guid(bytes.AsSpan(0, 16));
    }
}
