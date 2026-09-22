using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FourRealityDriftAnalyzerTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid CurrentSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid PriorSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid SourcePathId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid StorageCloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ChangeId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private const string StorageArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

    [Fact]
    public void Analyze_terraform_private_observed_public_on_privilege_path_returns_drift()
    {
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: true,
            terraformPublicNetworkAccess: "disabled");

        SecurityEvidencePathRecord sourcePath = BuildSourcePath();
        IReadOnlyList<SecurityEvidencePathHopRecord> hops = BuildSourceHops();

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                SourcePaths = [sourcePath],
                HopsByPathId = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
                {
                    [SourcePathId] = hops,
                },
            });

        candidates.Should().ContainSingle();
        candidates[0].CloudResourceId.Should().Be(StorageCloudResourceId);
        candidates[0].ObservedPosture.Should().Be(FourRealityAccessPosture.Public);
        candidates[0].TerraformPosture.Should().Be(FourRealityAccessPosture.Private);
    }

    [Fact]
    public void Analyze_identical_realities_returns_none()
    {
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: false,
            terraformPublicNetworkAccess: "disabled");

        SecurityEvidencePathRecord sourcePath = BuildSourcePath();
        IReadOnlyList<SecurityEvidencePathHopRecord> hops = BuildSourceHops();

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                PriorSnapshot = BuildSnapshot(
                    PriorSnapshotId,
                    enablePublicNetworkAccess: false,
                    terraformPublicNetworkAccess: "disabled"),
                SourcePaths = [sourcePath],
                HopsByPathId = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
                {
                    [SourcePathId] = hops,
                },
            });

        candidates.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_temporal_widening_without_diagram_still_returns_drift()
    {
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: true,
            terraformPublicNetworkAccess: null);

        AzureInventorySnapshotDetailReadModel priorSnapshot = BuildSnapshot(
            PriorSnapshotId,
            enablePublicNetworkAccess: false,
            terraformPublicNetworkAccess: null);

        SecurityEvidencePathRecord sourcePath = BuildSourcePath();
        IReadOnlyList<SecurityEvidencePathHopRecord> hops = BuildSourceHops();

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                PriorSnapshot = priorSnapshot,
                InventoryDiffId = Guid.NewGuid(),
                DiffChanges =
                [
                    new AzureInventoryChangeRecord
                    {
                        ChangeId = ChangeId,
                        CloudResourceId = StorageCloudResourceId,
                        ChangeType = AzureInventoryChangeType.NetworkExposureChanged,
                        Property = "enablePublicNetworkAccess",
                        OldValue = "false",
                        NewValue = "true",
                    },
                ],
                DiagramReconciliation = null,
                SourcePaths = [sourcePath],
                HopsByPathId = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
                {
                    [SourcePathId] = hops,
                },
            });

        candidates.Should().ContainSingle();
        candidates[0].HistoricalPosture.Should().Be(FourRealityAccessPosture.Private);
        candidates[0].DiagramPosture.Should().Be(FourRealityAccessPosture.Unknown);
        candidates[0].RelatedChangeId.Should().Be(ChangeId);
    }

    [Fact]
    public void Analyze_diagram_private_label_with_observed_public_returns_drift()
    {
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: true,
            terraformPublicNetworkAccess: null);

        DiagramInfrastructureReconciliationResult reconciliation = new()
        {
            SnapshotId = CurrentSnapshotId,
            Rows =
            [
                new DiagramInfrastructureCorrespondenceRow
                {
                    CloudResourceId = StorageCloudResourceId,
                    AzureResourceId = StorageArm,
                    DiagramNodeLabel = "SQL (private endpoint only)",
                    MatchKind = DiagramInfrastructureMatchKinds.Exact,
                },
            ],
        };

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                DiagramReconciliation = reconciliation,
                SourcePaths = [BuildSourcePath()],
                HopsByPathId = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>
                {
                    [SourcePathId] = BuildSourceHops(),
                },
            });

        candidates.Should().ContainSingle();
        candidates[0].DiagramPosture.Should().Be(FourRealityAccessPosture.Private);
    }

    private static SecurityEvidencePathRecord BuildSourcePath()
    {
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = new()
        {
            PathId = SourcePathId,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = CurrentSnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        return SecurityEvidencePathGuard.ValidateAndMaterialize(header, BuildSourceHops()).Path;
    }

    private static List<SecurityEvidencePathHopRecord> BuildSourceHops() =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = SourcePathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = "principal:owner",
            ToNodeId = StorageArm,
            EdgeType = GraphEdgeTypes.CanWrite,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:write",
            CloudResourceId = StorageCloudResourceId,
        },
    ];

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        bool enablePublicNetworkAccess,
        string? terraformPublicNetworkAccess)
    {
        Guid storageRowId = Guid.NewGuid();
        List<AzureInventoryResourcePropertyReadModel> properties =
        [
            new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = storageRowId,
                PropertyKey = "enablePublicNetworkAccess",
                PropertyValue = enablePublicNetworkAccess ? "true" : "false",
            },
        ];

        if (!string.IsNullOrWhiteSpace(terraformPublicNetworkAccess))
        {
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = storageRowId,
                PropertyKey = "tf.public_network_access",
                PropertyValue = terraformPublicNetworkAccess,
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = TenantId,
                SubscriptionId = "11111111-1111-1111-1111-111111111111",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = storageRowId,
                    SnapshotId = snapshotId,
                    TenantId = TenantId,
                    AzureResourceId = StorageArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = StorageCloudResourceId,
                },
            ],
            Properties = properties,
        };
    }
}
