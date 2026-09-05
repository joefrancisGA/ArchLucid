using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditEvidenceSelectionServiceTests
{
    [Fact]
    public async Task TrySelectForFrameworkAsync_without_logging_requirement_does_not_need_logging_rows()
    {
        Guid snapshotId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
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
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = Guid.NewGuid(),
                    PropertyKey = "encryption.keySource",
                    PropertyValue = "Microsoft.Storage",
                },
            ],
        };

        AuditEvidenceRequirementRecord inventoryRequirement = new()
        {
            RequirementId = Guid.NewGuid(),
            FrameworkId = frameworkId,
            ControlId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            Name = "Inventory coverage",
            EvidenceType = AuditEvidenceTypeNames.Inventory,
        };

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(r => r.TryGetSnapshotDetailAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IAuditEvidenceRequirementRepository> requirementRepository = new();
        requirementRepository
            .Setup(r => r.ListByFrameworkIdAsync(scope.TenantId, frameworkId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([inventoryRequirement]);

        AuditEvidenceSelectorRegistry registry = BuildRegistry();
        AuditEvidenceSelectionService service = new(
            snapshotRepository.Object,
            requirementRepository.Object,
            registry,
            Mock.Of<Microsoft.Extensions.Logging.ILogger<AuditEvidenceSelectionService>>());

        AuditEvidenceSelectionResult? result =
            await service.TrySelectForFrameworkAsync(scope, snapshotId, frameworkId);

        result.Should().NotBeNull();
        result!.Selections.Should().ContainSingle();
        result.Selections[0].CollectionStatus.Should().Be(AuditEvidenceCollectionStatus.Collected);
    }

    [Fact]
    public void Logging_selector_returns_insufficient_when_diagnostics_missing()
    {
        LoggingAuditEvidenceSelector selector = new();
        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = Guid.NewGuid(),
            EvidenceType = AuditEvidenceTypeNames.Logging,
            Name = "Diagnostic settings",
        };

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord(),
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

        AuditEvidenceRequirementSelectionRecord selection = selector.Select(snapshot, requirement);

        selection.CollectionStatus.Should().Be(AuditEvidenceCollectionStatus.Insufficient);
    }

    [Fact]
    public void Identity_selector_returns_unsupported_for_entra_requirement()
    {
        IdentityAuditEvidenceSelector selector = new();
        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = Guid.NewGuid(),
            EvidenceType = "entra-conditional-access",
            Name = "Conditional access policies",
        };

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord(),
        };

        AuditEvidenceRequirementSelectionRecord selection = selector.Select(snapshot, requirement);

        selection.CollectionStatus.Should().Be(AuditEvidenceCollectionStatus.Unsupported);
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
            new ResilienceAuditEvidenceSelector());
}
