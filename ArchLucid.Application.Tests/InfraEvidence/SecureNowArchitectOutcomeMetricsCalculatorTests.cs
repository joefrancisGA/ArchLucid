using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectOutcomeMetricsCalculatorTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid FromSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ToSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid RemovedPathId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid RemainingPathId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public void Calculate_one_critical_path_removed_counts_one()
    {
        SecurityEvidencePathRecord removedPath = BuildPath(
            RemovedPathId,
            PathKind.Privilege,
            PathConfidenceBand.Confirmed,
            BuildPrivilegeHops(RemovedPathId, identitySuffix: "removed"));
        SecurityEvidencePathRecord remainingPath = BuildPath(
            RemainingPathId,
            PathKind.Privilege,
            PathConfidenceBand.Probable,
            BuildPrivilegeHops(RemainingPathId, identitySuffix: "remaining"));

        SecureNowArchitectOutcomeMetricsResult result = Calculate(
            fromPaths: [removedPath, remainingPath],
            toPaths: [remainingPath],
            fromHopsByPathId: new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
            {
                [RemovedPathId] = BuildPrivilegeHops(RemovedPathId, identitySuffix: "removed"),
                [RemainingPathId] = BuildPrivilegeHops(RemainingPathId, identitySuffix: "remaining"),
            },
            toHopsByPathId: new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
            {
                [RemainingPathId] = BuildPrivilegeHops(RemainingPathId, identitySuffix: "remaining"),
            });

        result.CriticalOrHighConfidencePathsRemoved.Should().Be(1);
    }

    [Fact]
    public void Calculate_identical_snapshots_returns_zeros()
    {
        SecurityEvidencePathRecord path = BuildPath(
            RemovedPathId,
            PathKind.Privilege,
            PathConfidenceBand.Confirmed,
            BuildPrivilegeHops(RemovedPathId));

        SecureNowArchitectOutcomeMetricsResult result = Calculate(
            fromPaths: [path],
            toPaths: [path],
            sameSnapshot: true);

        result.CriticalOrHighConfidencePathsRemoved.Should().Be(0);
        result.PrivilegedIdentityNodesOnPathsReduced.Should().Be(0);
        result.UnrestrictedEgressCapabilityPathsReduced.Should().Be(0);
        result.AssertedCrownJewelExposurePathsRemoved.Should().Be(0);
        result.SharedControlBlastRadiusPathsRemoved.Should().Be(0);
        result.ExceptionsExpired.Should().Be(0);
        result.RemediationRecurrenceCount.Should().Be(0);
    }

    [Fact]
    public void Calculate_remediation_recurrence_counts_cloud_resource_and_control_pair()
    {
        Guid cloudResourceId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        DateTime fromAnchor = DateTime.UtcNow.AddDays(-7);
        DateTime toAnchor = DateTime.UtcNow;

        SecureNowArchitectOutcomeMetricsResult result = SecureNowArchitectOutcomeMetricsCalculator.Calculate(
            new SecureNowArchitectOutcomeMetricsInputs
            {
                FromSnapshot = BuildSnapshot(FromSnapshotId, fromAnchor),
                ToSnapshot = BuildSnapshot(ToSnapshotId, toAnchor),
                Findings =
                [
                    new OperationalSecurityFindingRecord
                    {
                        FindingId = Guid.NewGuid(),
                        TenantId = TenantId,
                        WorkspaceId = Guid.NewGuid(),
                        ProjectId = Guid.NewGuid(),
                        Provider = Contracts.Common.CloudProvider.Azure,
                        SourceSystem = "test",
                        SourceFindingId = "closed-1",
                        CloudResourceId = cloudResourceId,
                        ControlId = "securenow.privilege-path",
                        Title = "closed",
                        Status = OperationalSecurityFindingStatus.Closed,
                        FirstObservedUtc = fromAnchor.AddDays(-30),
                        LastObservedUtc = fromAnchor.AddDays(-2),
                        CreatedUtc = fromAnchor.AddDays(-30),
                        UpdatedUtc = fromAnchor.AddDays(-2),
                    },
                    new OperationalSecurityFindingRecord
                    {
                        FindingId = Guid.NewGuid(),
                        TenantId = TenantId,
                        WorkspaceId = Guid.NewGuid(),
                        ProjectId = Guid.NewGuid(),
                        Provider = Contracts.Common.CloudProvider.Azure,
                        SourceSystem = "test",
                        SourceFindingId = "recurred-1",
                        CloudResourceId = cloudResourceId,
                        ControlId = "securenow.privilege-path",
                        Title = "recurred",
                        Status = OperationalSecurityFindingStatus.Recurred,
                        FirstObservedUtc = fromAnchor.AddDays(-30),
                        LastObservedUtc = toAnchor.AddDays(-1),
                        CreatedUtc = fromAnchor.AddDays(-30),
                        UpdatedUtc = toAnchor.AddDays(-1),
                    },
                ],
            });

        result.RemediationRecurrenceCount.Should().Be(1);
    }

    private static SecureNowArchitectOutcomeMetricsResult Calculate(
        IReadOnlyList<SecurityEvidencePathRecord> fromPaths,
        IReadOnlyList<SecurityEvidencePathRecord> toPaths,
        bool sameSnapshot = false,
        IReadOnlyDictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>? fromHopsByPathId = null,
        IReadOnlyDictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>? toHopsByPathId = null)
    {
        DateTime anchor = DateTime.UtcNow.AddDays(-1);

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> resolvedFromHops =
            fromHopsByPathId?.ToDictionary(pair => pair.Key, pair => pair.Value)
            ?? fromPaths.ToDictionary(
                path => path.PathId,
                path => BuildPrivilegeHops(path.PathId) as IReadOnlyList<SecurityEvidencePathHopRecord>);

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> resolvedToHops =
            toHopsByPathId?.ToDictionary(pair => pair.Key, pair => pair.Value)
            ?? toPaths.ToDictionary(
                path => path.PathId,
                path => BuildPrivilegeHops(path.PathId) as IReadOnlyList<SecurityEvidencePathHopRecord>);

        return SecureNowArchitectOutcomeMetricsCalculator.Calculate(
            new SecureNowArchitectOutcomeMetricsInputs
            {
                FromSnapshot = BuildSnapshot(sameSnapshot ? FromSnapshotId : FromSnapshotId, anchor),
                ToSnapshot = BuildSnapshot(sameSnapshot ? FromSnapshotId : ToSnapshotId, anchor),
                FromPaths = new SecureNowArchitectOutcomeMetricsSnapshotData
                {
                    Paths = fromPaths,
                    HopsByPathId = resolvedFromHops,
                },
                ToPaths = new SecureNowArchitectOutcomeMetricsSnapshotData
                {
                    Paths = toPaths,
                    HopsByPathId = resolvedToHops,
                },
            });
    }

    private static AzureInventorySnapshotRecord BuildSnapshot(Guid snapshotId, DateTime anchorUtc) =>
        new()
        {
            SnapshotId = snapshotId,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            PackageId = Guid.NewGuid(),
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            CaptureMethod = AzureInventoryCaptureMethod.HostedReader,
            CreatedUtc = anchorUtc.AddDays(-1),
            UpdatedUtc = anchorUtc,
        };

    private static SecurityEvidencePathRecord BuildPath(
        Guid pathId,
        PathKind pathKind,
        PathConfidenceBand confidenceBand,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = new()
        {
            PathId = pathId,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = FromSnapshotId,
            PathKind = pathKind,
            PathConfidenceBand = confidenceBand,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        return validated.Path;
    }

    private static List<SecurityEvidencePathHopRecord> BuildPrivilegeHops(Guid pathId, string identitySuffix = "default") =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = $"identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identitySuffix}",
            ToNodeId = $"resource:storage/{identitySuffix}",
            EdgeType = GraphEdgeTypes.UsesIdentity,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:identity",
        },
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 2,
            FromNodeId = "principal:owner",
            ToNodeId = $"resource:storage/{identitySuffix}",
            EdgeType = GraphEdgeTypes.CanWrite,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:write",
        },
    ];
}
