using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreFinalizeExecuteBaselineDriftEvaluatorTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly Guid PackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task EvaluateAsync_returns_no_items_when_governance_scope_json_is_missing()
    {
        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut();

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            CreateRequest(),
            governanceScopeJson: null,
            CancellationToken.None);

        items.Should().BeEmpty();
    }

    [Fact]
    public async Task EvaluateAsync_returns_no_items_when_snapshot_cannot_be_decoded()
    {
        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut();

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            CreateRequest(),
            governanceScopeJson: "not-json",
            CancellationToken.None);

        items.Should().BeEmpty();
    }

    [Fact]
    public async Task EvaluateAsync_adds_blocking_item_when_request_fingerprint_drifts()
    {
        ArchitectureRequest request = CreateRequest();
        string driftedFingerprint = Convert.ToHexString(
            ArchitectureRunIdempotencyHashing.FingerprintRequest(CreateRequest("mutated after execute")));

        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut();

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            request,
            SnapshotJson(request, driftedFingerprint, governanceAssignmentsHashHex: null),
            CancellationToken.None);

        items.Should().ContainSingle(item =>
            item.ItemId == "request-changed-since-execute"
            && item.Status == PreFinalizeChecklistItemStatus.Blocking
            && item.Count == 1);
    }

    [Fact]
    public async Task EvaluateAsync_omits_request_item_when_request_fingerprint_matches()
    {
        ArchitectureRequest request = CreateRequest();

        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut();

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            request,
            SnapshotJson(request, requestFingerprintHex: null, governanceAssignmentsHashHex: null),
            CancellationToken.None);

        items.Should().NotContain(item => item.ItemId == "request-changed-since-execute");
    }

    [Fact]
    public async Task EvaluateAsync_adds_blocking_item_when_policy_pack_assignments_drift()
    {
        ArchitectureRequest request = CreateRequest();
        Mock<IPolicyPackAssignmentRepository> assignments = SetupPackAssignment("2.0.0");

        // Snapshot was captured at execute when the assignment was still on version 1.0.0.
        string executeHash = PreFinalizeExecuteBaselineDriftEvaluator.HashPackAssignments([SnapshotRow("1.0.0")]);

        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut(policyPackAssignmentRepository: assignments.Object);

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            request,
            SnapshotJson(request, requestFingerprintHex: null, governanceAssignmentsHashHex: executeHash),
            CancellationToken.None);

        items.Should().ContainSingle(item =>
            item.ItemId == "policy-pack-changed-since-execute"
            && item.Status == PreFinalizeChecklistItemStatus.Blocking
            && item.Count == 1);
    }

    [Fact]
    public async Task EvaluateAsync_omits_pack_item_when_policy_pack_assignments_match()
    {
        ArchitectureRequest request = CreateRequest();
        Mock<IPolicyPackAssignmentRepository> assignments = SetupPackAssignment("2.0.0");
        string executeHash = PreFinalizeExecuteBaselineDriftEvaluator.HashPackAssignments([SnapshotRow("2.0.0")]);

        PreFinalizeExecuteBaselineDriftEvaluator sut = CreateSut(policyPackAssignmentRepository: assignments.Object);

        IReadOnlyList<PreFinalizeChecklistItem> items = await sut.EvaluateAsync(
            TestScope,
            request,
            SnapshotJson(request, requestFingerprintHex: null, governanceAssignmentsHashHex: executeHash),
            CancellationToken.None);

        items.Should().BeEmpty();
    }

    private static ArchitectureRequest CreateRequest(string description = "Design the order service.") =>
        new()
        {
            CloudProvider = CloudProvider.Azure,
            Description = description,
            PolicyReferences = []
        };

    private static CommittedGovernancePackAssignmentSnapshot SnapshotRow(string version) =>
        new()
        {
            PolicyPackId = PackId,
            PolicyPackVersion = version,
            ScopeLevel = GovernanceScopeLevel.Project
        };

    private static string SnapshotJson(
        ArchitectureRequest request,
        string? requestFingerprintHex,
        string? governanceAssignmentsHashHex) =>
        ExecutedEffectiveGovernanceSnapshotJson.Serialize(new ExecutedEffectiveGovernanceSnapshotDescriptor
        {
            GeneratedUtc = DateTime.UtcNow,
            CloudProvider = request.CloudProvider.ToString(),
            RequestFingerprintHex = requestFingerprintHex
                ?? Convert.ToHexString(ArchitectureRunIdempotencyHashing.FingerprintRequest(request)),
            GovernanceAssignmentsHashHex = governanceAssignmentsHashHex
        });

    private static Mock<IPolicyPackAssignmentRepository> SetupPackAssignment(string version)
    {
        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(
                TestScope.TenantId,
                TestScope.WorkspaceId,
                TestScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new PolicyPackAssignment
                {
                    TenantId = TestScope.TenantId,
                    WorkspaceId = TestScope.WorkspaceId,
                    ProjectId = TestScope.ProjectId,
                    PolicyPackId = PackId,
                    PolicyPackVersion = version,
                    ScopeLevel = GovernanceScopeLevel.Project,
                    IsEnabled = true
                }
            ]);

        return assignments;
    }

    private static PreFinalizeExecuteBaselineDriftEvaluator CreateSut(
        IPolicyPackAssignmentRepository? policyPackAssignmentRepository = null)
    {
        Mock<IPolicyPackAssignmentRepository> emptyAssignments = new();
        emptyAssignments
            .Setup(r => r.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(
                TestScope.TenantId,
                TestScope.WorkspaceId,
                TestScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId
            });

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new PolicyPack
                {
                    PolicyPackId = PackId,
                    Name = "Security Architecture Baseline",
                    TenantId = TestScope.TenantId,
                    QualityDimension = QualityDimension.Security
                }
            ]);

        return new PreFinalizeExecuteBaselineDriftEvaluator(
            resolver.Object,
            new EffectiveGovernanceSnapshotBuilder(),
            policyPackAssignmentRepository ?? emptyAssignments.Object,
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>());
    }
}
