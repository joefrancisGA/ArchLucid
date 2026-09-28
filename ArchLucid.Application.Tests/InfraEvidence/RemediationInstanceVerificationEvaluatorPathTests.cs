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
    private static readonly DateTime ExecutionCapturedUtc = new(2026, 9, 27, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime VerificationCapturedUtc = new(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc);

    [Fact]
    public void Evaluate_path_hash_absent_passes_when_equivalent_path_missing()
    {
        RemediationPathNarrative narrative = CreateNarrative();
        RemediationPathVerificationContext context = new()
        {
            PathAnalysisCompleted = true,
            SourcePathCanonicalHash = CanonicalHash,
            VerificationSnapshotPaths = [],
        };

        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc,
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
            PathAnalysisCompleted = true,
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
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc,
            narrative,
            context);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("path:hash-absent", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_path_hash_absent_fails_when_path_analysis_did_not_complete()
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
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc,
            narrative,
            context);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("path analysis did not complete for the verification snapshot", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_when_no_substantive_postcondition_is_present()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("substantive postcondition", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_when_only_resource_presence_postcondition_passes()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent
            {
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["snapshot.resource.present"],
                },
            },
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("substantive postcondition", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_passes_when_resource_presence_and_property_postconditions_pass()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent
            {
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries =
                    [
                        "snapshot.resource.present",
                        "property:enablePublicNetworkAccess=false",
                    ],
                },
            },
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_fails_when_property_postcondition_does_not_match()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent
            {
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["property:enablePublicNetworkAccess=true"],
                },
            },
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("expected 'true' but found 'false'", StringComparison.OrdinalIgnoreCase));
        result.Failures.Should().NotContain(failure =>
            failure.Contains("postcondition was satisfied", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_for_older_verification_snapshot_with_different_id()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: ExecutionCapturedUtc.AddMinutes(-1)),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.Contains("strictly later", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_for_same_snapshot_id()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                snapshotId: ExecutionSnapshotId,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.Contains("must not reuse", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_for_null_verification_capture_time()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: null),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.Contains("verification snapshot capture time is missing", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_for_null_execution_capture_time()
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc),
            ExecutionSnapshotId,
            executionCapturedUtc: null);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.Contains("execution snapshot capture time is missing", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData(AzureInventoryCaptureStatus.Pending)]
    [InlineData(AzureInventoryCaptureStatus.Partial)]
    [InlineData(AzureInventoryCaptureStatus.Failed)]
    public void Evaluate_fails_for_unsuccessful_verification_capture(AzureInventoryCaptureStatus captureStatus)
    {
        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            CreateInstance(),
            new RemediationPatternVersionContent(),
            CreateSnapshot(
                includeResource: true,
                includeDisabledPublicAccess: true,
                capturedUtc: VerificationCapturedUtc,
                captureStatus: captureStatus),
            ExecutionSnapshotId,
            ExecutionCapturedUtc);

        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure =>
            failure.Contains("capture status failed", StringComparison.OrdinalIgnoreCase)
            && failure.Contains(captureStatus.ToString(), StringComparison.OrdinalIgnoreCase));
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
            Status = RemediationInstanceStatus.ChangeImplemented,
            ChangeImplementedUtc = DateTime.UnixEpoch,
            CloudResourceId = CloudResourceId,
            ExecutionSnapshotId = ExecutionSnapshotId,
            CreatedByActorKey = "creator",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        bool includeResource,
        bool includeDisabledPublicAccess,
        Guid? snapshotId = null,
        DateTime? capturedUtc = null,
        AzureInventoryCaptureStatus captureStatus = AzureInventoryCaptureStatus.Succeeded)
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
                SnapshotId = snapshotId ?? VerificationSnapshotId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = captureStatus,
                CapturedUtc = capturedUtc,
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
