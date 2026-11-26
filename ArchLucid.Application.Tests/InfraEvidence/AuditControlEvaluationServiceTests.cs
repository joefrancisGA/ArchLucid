using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditControlEvaluationServiceTests
{
    [Fact]
    public async Task TryEvaluateControlAsync_persists_evaluation_without_human_disposition()
    {
        Guid snapshotId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        ScopeContext scope = new();

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord { SnapshotId = snapshotId },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
        };

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(r => r.TryGetSnapshotDetailAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IAuditEvidenceRequirementRepository> requirementRepository = new();
        requirementRepository
            .Setup(r => r.ListByControlIdAsync(scope.TenantId, controlId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    ControlId = controlId,
                    FrameworkId = frameworkId,
                    TenantId = scope.TenantId,
                    Name = "Inventory",
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                },
            ]);

        CapturingEvaluationRepository evaluationRepository = new();

        AuditControlEvaluationService service = new(
            snapshotRepository.Object,
            requirementRepository.Object,
            BuildRegistry(),
            evaluationRepository,
            Mock.Of<IAuditEvidenceSnapshotRepository>(),
            NullLogger<AuditControlEvaluationService>.Instance);

        AuditControlEvaluationResult result = await service.TryEvaluateControlAsync(
            scope,
            snapshotId,
            frameworkId,
            controlId,
            [],
            []);

        result.Succeeded.Should().BeTrue();
        result.Evaluation.Should().NotBeNull();
        result.Evaluation!.HumanDisposition.Should().BeNull();
        evaluationRepository.LastRequest.Should().NotBeNull();
        evaluationRepository.LastRequest!.Evaluation.HumanDisposition.Should().BeNull();
    }

    [Theory]
    [InlineData(AuditEvidenceTypeNames.Network, false, false, true)]
    [InlineData(AuditEvidenceTypeNames.Identity, false, false, false)]
    [InlineData(AuditEvidenceTypeNames.Rbac, false, false, false)]
    [InlineData(AuditEvidenceTypeNames.Network, true, false, false)]
    [InlineData(AuditEvidenceTypeNames.Network, false, true, false)]
    public async Task TryEvaluateControlAsync_scopes_only_explicit_Entra_partial_capture(
        string evidenceType, bool unknownWarning, bool omitMarker, bool expectedSupported)
    {
        Guid snapshotId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        ScopeContext scope = new();
        List<string> warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphIncomplete];
        if (!omitMarker)
            warnings.Add(SecurityEvidenceAddCredentialAdapterWarnings.EntraOnlyCapturePartial);
        if (unknownWarning)
            warnings.Add("unknown-collection-gap");

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                CaptureStatus = AzureInventoryCaptureStatus.Partial,
                ResourceCount = 2,
                WarningCount = warnings.Count,
                CompletenessWarningsJson = AzureInventorySnapshotCompletenessWarningsJson.Serialize(warnings),
            },
            Resources =
            [
                new AzureInventoryResourceRecord { AzureResourceId = "/network", ResourceType = "Microsoft.Network/virtualNetworks" },
                new AzureInventoryResourceRecord { AzureResourceId = "/identity", ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities" },
            ],
            RoleAssignments = [new AzureInventoryRoleAssignmentReadModel { Scope = "/network", RoleDefinitionId = "reader" }],
        };
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots.Setup(r => r.TryGetSnapshotDetailAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        Mock<IAuditEvidenceRequirementRepository> requirements = new();
        requirements.Setup(r => r.ListByControlIdAsync(scope.TenantId, controlId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new AuditEvidenceRequirementRecord
            {
                RequirementId = Guid.NewGuid(), ControlId = controlId, FrameworkId = frameworkId,
                EvidenceType = evidenceType,
            }]);
        AuditControlEvaluationService service = new(
            snapshots.Object, requirements.Object, BuildRegistry(), new CapturingEvaluationRepository(),
            Mock.Of<IAuditEvidenceSnapshotRepository>(), NullLogger<AuditControlEvaluationService>.Instance);

        AuditControlEvaluationResult result = await service.TryEvaluateControlAsync(
            scope, snapshotId, frameworkId, controlId, [], []);
        result.Succeeded.Should().BeTrue();
        result.Evaluation!.Outcome.Should().Be(expectedSupported
            ? AuditEvaluationOutcome.TechnicallySupported
            : AuditEvaluationOutcome.InsufficientEvidence);
    }

    private static AuditEvidenceSelectorRegistry BuildRegistry() =>
        new(
            new InventoryAuditEvidenceSelector(),
            new IdentityAuditEvidenceSelector(),
            new RbacAuditEvidenceSelector(),
            new NetworkAuditEvidenceSelector(),
            new DataAuditEvidenceSelector(),
            new LoggingAuditEvidenceSelector(),
            new GovernanceAuditEvidenceSelector(),
            new PostureAuditEvidenceSelector(),
            new ResilienceAuditEvidenceSelector(),
            new DefenderAuditEvidenceSelector());

    [Theory]
    [InlineData("complete", "complete", false, false, 2, 0, AuditEvaluationOutcome.TechnicallySupported)]
    [InlineData("complete", "partial", false, false, 2, 0, AuditEvaluationOutcome.InsufficientEvidence)]
    [InlineData("complete", "empty", false, true, 1, 0, AuditEvaluationOutcome.TechnicallyNotSupported)]
    [InlineData("complete", "missing", false, false, 1, 1, AuditEvaluationOutcome.InsufficientEvidence)]
    [InlineData("complete", "failed", false, true, 1, 1, AuditEvaluationOutcome.TechnicallyNotSupported)]
    [InlineData("complete", "recoverable", false, false, 1, 1, AuditEvaluationOutcome.InsufficientEvidence)]
    [InlineData("missing", "complete", false, true, 1, 1, AuditEvaluationOutcome.TechnicallyNotSupported)]
    [InlineData("missing", "mismatched", false, false, 0, 2, AuditEvaluationOutcome.InsufficientEvidence)]
    [InlineData("complete", "complete", true, false, 2, 0, AuditEvaluationOutcome.InsufficientEvidence)]
    [InlineData("complete", "cancelled", false, false, 0, 0, AuditEvaluationOutcome.InsufficientEvidence)]
    public async Task Current_assessment_evaluates_all_distinct_links_and_preserves_observed_failures(
        string first, string second, bool recordedCollectionFailure, bool observedFailure,
        int expectedCandidates, int expectedUnavailable, AuditEvaluationOutcome expected)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        ProjectScopeKey projectScope = scope.ToProjectScopeKey();
        Guid auditSnapshotId = Guid.NewGuid();
        Guid firstId = Guid.NewGuid();
        Guid secondId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        const string firstResource = "/subscriptions/sub-a/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/a";
        const string secondResource = "/subscriptions/sub-b/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/b";
        using CancellationTokenSource cancellation = new();
        CancellationToken token = cancellation.Token;
        Mock<IAzureInventorySnapshotRepository> inventory = new(MockBehavior.Strict);
        SetUpLinkedInventory(firstId, first, firstResource);
        SetUpLinkedInventory(secondId, second, secondResource);
        Mock<IAuditEvidenceRequirementRepository> requirements = new(MockBehavior.Strict);
        requirements.Setup(r => r.ListByControlIdAsync(scope.TenantId, controlId, token))
            .ReturnsAsync([new AuditEvidenceRequirementRecord
            {
                RequirementId = requirementId, ControlId = controlId, FrameworkId = frameworkId,
                EvidenceType = AuditEvidenceTypeNames.Inventory,
            }]);
        Mock<IAuditEvidenceSnapshotRepository> audit = new(MockBehavior.Strict);
        audit.Setup(r => r.ListItemsInScopeAsync(projectScope, auditSnapshotId, token)).ReturnsAsync([]);
        audit.Setup(r => r.TryGetHeaderInScopeAsync(projectScope, auditSnapshotId, token))
            .ReturnsAsync(new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditSnapshotId, TenantId = scope.TenantId,
                InventorySnapshotIds = [firstId, secondId, firstId],
                Failures = recordedCollectionFailure ? ["A linked source failed during audit collection."] : [],
            });
        CapturingEvaluationRepository persistence = new();
        AuditControlEvaluationService service = new(
            inventory.Object, requirements.Object, BuildRegistry(), persistence, audit.Object,
            NullLogger<AuditControlEvaluationService>.Instance);

        if (second == "cancelled")
        {
            Func<Task> evaluate = () => service.TryEvaluateControlForCurrentAssessmentAsync(
                scope, auditSnapshotId, frameworkId, controlId, [], [], token);
            await evaluate.Should().ThrowAsync<OperationCanceledException>();
            persistence.LastRequest.Should().BeNull();
            return;
        }

        AuditControlEvaluationResult result = await service.TryEvaluateControlForCurrentAssessmentAsync(
            scope, auditSnapshotId, frameworkId, controlId, [], observedFailure
                ? [first == "complete" ? firstResource : secondResource] : [], token);

        result.Succeeded.Should().BeTrue(result.ErrorMessage ?? string.Empty);
        result.Evaluation!.Outcome.Should().Be(expected);
        result.Evaluation.ApplicableCount.Should().Be(expectedCandidates);
        result.Evaluation.RequirementIds.Should().Equal(requirementId);
        result.EvidenceItems.Should().HaveCount(expectedCandidates);
        if (observedFailure)
        {
            result.Evaluation.Formula.Should().Contain("failingResources=1");
            result.EvidenceItems.Should().Contain(item => item.AzureResourceId ==
                (first == "complete" ? firstResource : secondResource));
        }
        if (expected == AuditEvaluationOutcome.TechnicallySupported)
            result.Evaluation.Formula.Should().NotContain("inventoryCaptureComplete=false");
        else
            result.Evaluation.Formula.Should().Contain("inventoryCaptureComplete=false");
        if (expectedUnavailable > 0)
            result.Evaluation.Formula.Should().Contain($"unavailableInventorySnapshotCount={expectedUnavailable}");

        inventory.Verify(r => r.TryGetSnapshotDetailAsync(scope, firstId, token), Times.Once);
        inventory.Verify(r => r.TryGetSnapshotDetailAsync(scope, secondId, token), Times.Once);
        inventory.VerifyNoOtherCalls();
        requirements.Verify(r => r.ListByControlIdAsync(scope.TenantId, controlId, token), Times.Once);
        persistence.LastScope.Should().Be(projectScope);
        persistence.LastRequest!.Evaluation.Should().BeSameAs(result.Evaluation);

        if (second == "recoverable")
        {
            SetUpLinkedInventory(secondId, "complete", secondResource);
            AuditControlEvaluationResult recovered = await service.TryEvaluateControlForCurrentAssessmentAsync(
                scope, auditSnapshotId, frameworkId, controlId, [], [], token);

            recovered.Succeeded.Should().BeTrue();
            recovered.Evaluation!.Outcome.Should().Be(AuditEvaluationOutcome.TechnicallySupported);
            recovered.EvidenceItems.Should().HaveCount(2);
            result.Evaluation.Outcome.Should().Be(AuditEvaluationOutcome.InsufficientEvidence);
        }

        void SetUpLinkedInventory(Guid id, string state, string resourceId)
        {
            var setup = inventory.Setup(r => r.TryGetSnapshotDetailAsync(scope, id, token));
            if (state is "failed" or "recoverable")
            {
                setup.ThrowsAsync(new InvalidOperationException("Simulated inventory read failure."));
                return;
            }
            if (state == "missing")
            {
                setup.ReturnsAsync((AzureInventorySnapshotDetailReadModel?)null);
                return;
            }
            if (state == "cancelled")
            {
                setup.ThrowsAsync(new OperationCanceledException(token));
                return;
            }
            setup.ReturnsAsync(new AzureInventorySnapshotDetailReadModel
            {
                Header = new AzureInventorySnapshotRecord
                {
                    SnapshotId = state == "mismatched" ? Guid.NewGuid() : id,
                    CaptureStatus = state is "partial" or "empty"
                        ? AzureInventoryCaptureStatus.Partial
                        : AzureInventoryCaptureStatus.Succeeded,
                },
                Resources = state == "empty"
                    ? []
                    : [new() { AzureResourceId = resourceId, ResourceType = "Microsoft.Storage/storageAccounts" }],
            });
        }
    }

    private sealed class CapturingEvaluationRepository : IAuditControlEvaluationRepository
    {
        public AuditControlEvaluationPersistRequest? LastRequest
        {
            get;
            private set;
        }

        public ProjectScopeKey? LastScope { get; private set; }

        public Task InsertInScopeAsync(
            ProjectScopeKey scope, AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
        {
            LastScope = scope;
            return InsertAsync(request, cancellationToken);
        }

        public Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
        {
            LastRequest = request;
            return Task.CompletedTask;
        }

        public Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
            Guid tenantId,
            Guid controlId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditControlEvaluationRecord?>(null);

        public Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
            Guid tenantId,
            Guid evaluationId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceItemRecord>>([]);
    }
}
