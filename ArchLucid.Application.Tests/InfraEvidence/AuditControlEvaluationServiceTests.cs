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

    private sealed class CapturingEvaluationRepository : IAuditControlEvaluationRepository
    {
        public AuditControlEvaluationPersistRequest? LastRequest
        {
            get;
            private set;
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
