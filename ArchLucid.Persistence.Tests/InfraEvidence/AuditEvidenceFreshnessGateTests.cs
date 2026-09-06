using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class AuditEvidenceFreshnessGateTests
{
    [Fact]
    public async Task TryEvaluateControlForCurrentAssessmentAsync_stale_item_returns_insufficient()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        Guid inventorySnapshotId = Guid.NewGuid();

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                InventorySnapshotIds = [inventorySnapshotId],
                EvidenceHashSha256 = [1],
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items =
            [
                new AuditEvidenceSnapshotItemRecord
                {
                    EvidenceRowId = Guid.NewGuid(),
                    AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                    RequirementId = requirementId,
                    TenantId = scope.TenantId,
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    CollectedUtc = DateTime.UtcNow.AddDays(-120),
                    CollectorVersion = "1.0.0",
                    EvidenceHashSha256 = [2],
                    CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                    FreshnessStatus = AuditEvidenceFreshnessStatus.Stale,
                    Confidence = 1.0m,
                    Summary = "stale evidence",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    SelectorVersion = "1.0.0",
                },
            ],
        });

        InMemoryAuditEvidenceRequirementRepository requirementRepository = new(frameworkId, scope.TenantId, requirementId, controlId);
        CapturingEvaluationRepository evaluationRepository = new();

        AuditControlEvaluationService service = new(
            MockInventoryRepository(inventorySnapshotId),
            requirementRepository,
            AuditEvidenceSelectionServiceTestsSupport.BuildRegistry(),
            evaluationRepository,
            snapshotRepository,
            NullLogger<AuditControlEvaluationService>.Instance);

        AuditControlEvaluationResult result = await service.TryEvaluateControlForCurrentAssessmentAsync(
            scope,
            auditEvidenceSnapshotId,
            frameworkId,
            controlId,
            [],
            []);

        result.Succeeded.Should().BeTrue();
        result.Evaluation.Should().NotBeNull();
        result.Evaluation!.Outcome.Should().Be(AuditEvaluationOutcome.InsufficientEvidence);
        result.Evaluation.EvaluationText.Should().Be(AuditControlEvaluationService.StaleEvidenceInsufficientLabel);
    }

    [Fact]
    public async Task ListHistoricalItemsAsync_returns_stale_row_with_label()
    {
        Guid tenantId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = Guid.NewGuid(),
                TenantId = tenantId,
                EvidenceHashSha256 = [1],
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items =
            [
                new AuditEvidenceSnapshotItemRecord
                {
                    EvidenceRowId = Guid.NewGuid(),
                    AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                    RequirementId = Guid.NewGuid(),
                    TenantId = tenantId,
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    CollectedUtc = DateTime.UtcNow.AddDays(-120),
                    CollectorVersion = "1.0.0",
                    EvidenceHashSha256 = [2],
                    CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                    FreshnessStatus = AuditEvidenceFreshnessStatus.Stale,
                    Confidence = 1.0m,
                    Summary = "historical stale evidence",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    SelectorVersion = "1.0.0",
                },
            ],
        });

        AuditEvidenceFreshnessService freshnessService = new(
            snapshotRepository,
            new InMemoryAuditEvidenceRequirementRepository(Guid.NewGuid(), tenantId, Guid.NewGuid(), Guid.NewGuid()),
            new InMemoryAuditAssessmentRepository(),
            NullLogger<AuditEvidenceFreshnessService>.Instance);

        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await freshnessService.ListHistoricalItemsAsync(tenantId, auditEvidenceSnapshotId);

        items.Should().ContainSingle();
        items[0].FreshnessStatus.Should().Be(AuditEvidenceFreshnessStatus.Stale);
        items[0].Summary.Should().Be("historical stale evidence");
    }

    private static IAzureInventorySnapshotRepository MockInventoryRepository(Guid inventorySnapshotId) =>
        new StubInventorySnapshotRepository(inventorySnapshotId);

    private sealed class InMemoryAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
    {
        private readonly Dictionary<Guid, AuditEvidenceSnapshotHeaderRecord> _headers = new();
        private readonly Dictionary<Guid, List<AuditEvidenceSnapshotItemRecord>> _items = new();

        public Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
        {
            _headers[request.Header.AuditEvidenceSnapshotId] = request.Header;
            _items[request.Header.AuditEvidenceSnapshotId] = request.Items.ToList();
            return Task.CompletedTask;
        }

        public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default)
        {
            if (_headers.TryGetValue(auditEvidenceSnapshotId, out AuditEvidenceSnapshotHeaderRecord? header)
                && header.TenantId == tenantId)
            {
                return Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(header);
            }

            return Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(null);
        }

        public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default)
        {
            if (_items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items))
                return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>(items);

            return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>([]);
        }

        public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>>([]);

        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
            Guid tenantId,
            Guid assessmentId,
            string baselineName,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditEvidenceBaselineRecord?>(null);

        public Task UpdateItemFreshnessAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class StubInventorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        private readonly Guid _inventorySnapshotId;

        public StubInventorySnapshotRepository(Guid inventorySnapshotId) => _inventorySnapshotId = inventorySnapshotId;

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<Guid?>(null);

        public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
            ScopeContext scope,
            int page,
            int pageSize,
            string? subscriptionId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord>, int)>(([], 0));
    }

    private sealed class InMemoryAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
    {
        private readonly List<AuditEvidenceRequirementRecord> _requirements;

        public InMemoryAuditEvidenceRequirementRepository(
            Guid frameworkId,
            Guid tenantId,
            Guid requirementId,
            Guid controlId)
        {
            _requirements =
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    FrameworkId = frameworkId,
                    ControlId = controlId,
                    TenantId = tenantId,
                    Name = "Inventory coverage",
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    RequiredFreshness = "30d",
                },
            ];
        }

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>(
                _requirements.Where(requirement => requirement.TenantId == tenantId && requirement.FrameworkId == frameworkId).ToList());

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
            Guid tenantId,
            Guid controlId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>(
                _requirements.Where(requirement => requirement.TenantId == tenantId && requirement.ControlId == controlId).ToList());
    }

    private sealed class InMemoryAuditAssessmentRepository : IAuditAssessmentRepository
    {
        public Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AuditAssessmentRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditAssessmentRecord?>(null);

        public Task UpdateStatusAsync(
            Guid tenantId,
            Guid assessmentId,
            AuditAssessmentStatus status,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>([]);
    }

    private sealed class CapturingEvaluationRepository : IAuditControlEvaluationRepository
    {
        public Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

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
