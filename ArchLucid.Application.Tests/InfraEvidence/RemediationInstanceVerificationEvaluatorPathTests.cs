using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationInstanceVerificationEvaluatorPathTests
{
    private static readonly Guid InstanceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid ExecutionSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid VerificationSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CloudResourceId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly byte[] CanonicalHash = Enumerable.Repeat((byte)0xCD, 32).ToArray();

    [Fact]
    public void Evaluate_path_hash_absent_passes_when_equivalent_path_missing()
    {
        RemediationPathNarrative narrative = CreateNarrative();
        RemediationPathVerificationContext context = new()
        {
            SourcePathCanonicalHash = CanonicalHash,
            VerificationSnapshotPaths = [],
        };

        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(includeResource: true, includeDisabledPublicAccess: true),
            ExecutionSnapshotId,
            narrative,
            context);

        result.Passed.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_path_hash_absent_fails_when_equivalent_path_still_present()
    {
        RemediationPathNarrative narrative = CreateNarrative();
        RemediationPathVerificationContext context = new()
        {
            SourcePathCanonicalHash = CanonicalHash,
            VerificationSnapshotPaths =
            [
                new SecurityEvidencePathRecord
                {
                    PathId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    SnapshotId = VerificationSnapshotId,
                    PathKind = PathKind.IntendedReachability,
                    PathConfidenceBand = PathConfidenceBand.HighlyLikely,
                    CanonicalHopHashSha256 = CanonicalHash,
                    WeakestHopOrdinal = 0,
                    WeakestHopReason = "still there",
                    CreatedUtc = DateTime.UtcNow,
                    UpdatedUtc = DateTime.UtcNow,
                },
            ],
        };

        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(includeResource: true, includeDisabledPublicAccess: true),
            ExecutionSnapshotId,
            narrative,
            context);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("path:hash-absent", StringComparison.OrdinalIgnoreCase));
    }

    private static RemediationPathNarrative CreateNarrative() =>
        new()
        {
            PathId = Guid.NewGuid(),
            PathKind = PathKind.IntendedReachability.ToString(),
            PathConfidenceBand = PathConfidenceBand.HighlyLikely.ToString(),
            ProblemStatement = "problem",
            WhyItMatters = "why",
            ExposureSummary = "exposure",
            RecommendedChange = "change",
            BlastRadiusWarning = $"CloudResourceIds: {CloudResourceId:D}",
            CanonicalHopHashHex = Convert.ToHexStringLower(CanonicalHash),
            VerificationQueries =
            [
                "snapshot.resource.present",
                $"path:hash-absent={Convert.ToHexStringLower(CanonicalHash)}",
                "property:enablePublicNetworkAccess=false",
            ],
        };

    private static RemediationInstanceRecord CreateInstance() =>
        new()
        {
            InstanceId = InstanceId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FindingId = Guid.NewGuid(),
            PatternId = Guid.NewGuid(),
            PatternVersionId = Guid.NewGuid(),
            PatternKey = "network.disable-public-storage",
            FrozenPatternVersion = "1.0.0",
            AutomationLevel = RemediationAutomationLevel.Guided,
            Status = RemediationInstanceStatus.Executed,
            CloudResourceId = CloudResourceId,
            ExecutionSnapshotId = ExecutionSnapshotId,
            CreatedByActorKey = "creator",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        bool includeResource,
        bool includeDisabledPublicAccess)
    {
        Guid resourceRowId = Guid.NewGuid();

        AzureInventoryResourceRecord? resource = includeResource
            ? new AzureInventoryResourceRecord
            {
                ResourceRowId = resourceRowId,
                CloudResourceId = CloudResourceId,
                AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
                ResourceType = "Microsoft.Storage/storageAccounts",
            }
            : null;

        List<AzureInventoryResourcePropertyReadModel> properties = [];

        if (includeResource && includeDisabledPublicAccess)
        {
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = resourceRowId,
                PropertyKey = "enablePublicNetworkAccess",
                PropertyValue = "false",
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = VerificationSnapshotId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resource is null ? [] : [resource],
            Properties = properties,
            Tags = [],
            Relationships = [],
            RoleAssignments = [],
            Diagnostics = [],
        };
    }
}
