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
public sealed class AuditContinuousReadinessServiceTests
{
    [Fact]
    public async Task ProcessInventoryDiffAsync_public_ip_add_invalidates_network_evidence_and_reevaluates_control()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid networkRequirementId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid diffId = Guid.NewGuid();

        InMemoryAuditAssessmentRepository assessmentRepository = new();
        await assessmentRepository.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentId,
            TenantId = scope.TenantId,
            FrameworkId = frameworkId,
            Status = AuditAssessmentStatus.Collecting,
            FrameworkVersion = "1.0",
            ScopeJson = "{}",
            RequestedBy = "test",
            CreatedUtc = DateTime.UtcNow,
        });

        InMemoryAuditEvidenceRequirementRepository requirementRepository = new(
            frameworkId,
            scope.TenantId,
            networkRequirementId,
            controlId,
            AuditEvidenceTypeNames.Network);

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        Guid evidenceRowId = Guid.NewGuid();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                EvidenceHashSha256 = [1],
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items =
            [
                new AuditEvidenceSnapshotItemRecord
                {
                    EvidenceRowId = evidenceRowId,
                    AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                    RequirementId = networkRequirementId,
                    TenantId = scope.TenantId,
                    EvidenceType = AuditEvidenceTypeNames.Network,
                    CollectedUtc = DateTime.UtcNow,
                    CollectorVersion = "1.0.0",
                    EvidenceHashSha256 = [2],
                    CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                    FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
                    Confidence = 1.0m,
                    Summary = "network baseline",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    SelectorVersion = "1.0.0",
                },
            ],
        });

        Mock<IAuditControlEvaluationService> evaluationService = new();
        evaluationService
            .Setup(service => service.TryEvaluateControlForCurrentAssessmentAsync(
                scope,
                auditEvidenceSnapshotId,
                frameworkId,
                controlId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuditControlEvaluationResult
            {
                Succeeded = true,
                Evaluation = new AuditControlEvaluationRecord
                {
                    ControlId = controlId,
                    Outcome = AuditEvaluationOutcome.InsufficientEvidence,
                    EvaluationText = AuditControlEvaluationService.StaleEvidenceInsufficientLabel,
                },
            });

        CapturingTimelineRepository timelineRepository = new();
        CapturingFindingHandoffService findingHandoffService = new();

        AuditContinuousReadinessService sut = new(
            assessmentRepository,
            requirementRepository,
            snapshotRepository,
            evaluationService.Object,
            timelineRepository,
            findingHandoffService,
            NullLogger<AuditContinuousReadinessService>.Instance);

        AzureInventoryDiffSummaryRecord summary = new()
        {
            DiffId = diffId,
            SnapshotAId = Guid.NewGuid(),
            SnapshotBId = Guid.NewGuid(),
            TotalChanges = 1,
            CreatedUtc = DateTime.UtcNow,
        };

        List<AzureInventoryChangeRecord> changes =
        [
            new()
            {
                ChangeId = Guid.NewGuid(),
                DiffId = diffId,
                ChangeType = AzureInventoryChangeType.ResourceAdded,
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-new",
            },
        ];

        AuditContinuousReadinessProcessResult result = await sut.ProcessInventoryDiffAsync(
            scope,
            summary,
            changes);

        result.Succeeded.Should().BeTrue();
        result.AffectedControlIds.Should().ContainSingle().Which.Should().Be(controlId);
        result.ReEvaluatedControlIds.Should().ContainSingle().Which.Should().Be(controlId);

        snapshotRepository.FreshnessUpdates.Should().ContainSingle();
        snapshotRepository.FreshnessUpdates[0].EvidenceRowId.Should().Be(evidenceRowId);
        snapshotRepository.FreshnessUpdates[0].FreshnessStatus.Should().Be(AuditEvidenceFreshnessStatus.Stale);

        timelineRepository.Records.Should().ContainSingle();
        timelineRepository.Records[0].State.Should().Be(AuditControlTechnicalTimelineState.DriftDetected);
        timelineRepository.Records[0].InventoryDiffId.Should().Be(diffId);

        findingHandoffService.Requests.Should().ContainSingle();
        evaluationService.Verify(
            service => service.TryEvaluateControlForCurrentAssessmentAsync(
                scope,
                auditEvidenceSnapshotId,
                frameworkId,
                controlId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessInventoryDiffAsync_tag_only_change_does_not_reevaluate_controls()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid inventoryRequirementId = Guid.NewGuid();

        InMemoryAuditAssessmentRepository assessmentRepository = new();
        await assessmentRepository.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentId,
            TenantId = scope.TenantId,
            FrameworkId = frameworkId,
            Status = AuditAssessmentStatus.Collecting,
            FrameworkVersion = "1.0",
            ScopeJson = "{}",
            RequestedBy = "test",
            CreatedUtc = DateTime.UtcNow,
        });

        InMemoryAuditEvidenceRequirementRepository requirementRepository = new(
            frameworkId,
            scope.TenantId,
            inventoryRequirementId,
            controlId,
            AuditEvidenceTypeNames.Inventory);

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = Guid.NewGuid(),
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
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
                    AuditEvidenceSnapshotId = Guid.NewGuid(),
                    RequirementId = inventoryRequirementId,
                    TenantId = scope.TenantId,
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    CollectedUtc = DateTime.UtcNow,
                    CollectorVersion = "1.0.0",
                    EvidenceHashSha256 = [2],
                    CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                    FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
                    Confidence = 1.0m,
                    Summary = "inventory baseline",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    SelectorVersion = "1.0.0",
                },
            ],
        });

        Mock<IAuditControlEvaluationService> evaluationService = new();

        AuditContinuousReadinessService sut = new(
            assessmentRepository,
            requirementRepository,
            snapshotRepository,
            evaluationService.Object,
            new CapturingTimelineRepository(),
            new CapturingFindingHandoffService(),
            NullLogger<AuditContinuousReadinessService>.Instance);

        AuditContinuousReadinessProcessResult result = await sut.ProcessInventoryDiffAsync(
            scope,
            new AzureInventoryDiffSummaryRecord
            {
                DiffId = Guid.NewGuid(),
                SnapshotAId = Guid.NewGuid(),
                SnapshotBId = Guid.NewGuid(),
                TotalChanges = 1,
                CreatedUtc = DateTime.UtcNow,
            },
            [
                new AzureInventoryChangeRecord
                {
                    ChangeId = Guid.NewGuid(),
                    DiffId = Guid.NewGuid(),
                    ChangeType = AzureInventoryChangeType.TagChanged,
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    Property = "environment",
                    OldValue = "dev",
                    NewValue = "prod",
                },
            ]);

        result.Succeeded.Should().BeTrue();
        result.AffectedControlIds.Should().BeEmpty();
        result.ReEvaluatedControlIds.Should().BeEmpty();
        snapshotRepository.FreshnessUpdates.Should().BeEmpty();
        evaluationService.Verify(
            service => service.TryEvaluateControlForCurrentAssessmentAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void GetImpactedEvidenceTypes_tag_changed_returns_empty_set()
    {
        IReadOnlySet<string> impacted = AuditInventoryChangeEvidenceImpactClassifier.GetImpactedEvidenceTypes(
            new AzureInventoryChangeRecord
            {
                ChangeId = Guid.NewGuid(),
                DiffId = Guid.NewGuid(),
                ChangeType = AzureInventoryChangeType.TagChanged,
            });

        impacted.Should().BeEmpty();
    }

    [Fact]
    public void GetImpactedEvidenceTypes_public_ip_add_maps_to_network()
    {
        IReadOnlySet<string> impacted = AuditInventoryChangeEvidenceImpactClassifier.GetImpactedEvidenceTypes(
            new AzureInventoryChangeRecord
            {
                ChangeId = Guid.NewGuid(),
                DiffId = Guid.NewGuid(),
                ChangeType = AzureInventoryChangeType.ResourceAdded,
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-new",
            });

        impacted.Should().ContainSingle().Which.Should().Be(AuditEvidenceTypeNames.Network);
    }

    private sealed class InMemoryAuditAssessmentRepository : IAuditAssessmentRepository
    {
        private readonly Dictionary<Guid, AuditAssessmentRecord> _assessments = new();

        public Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default)
        {
            _assessments[assessment.AssessmentId] = assessment;
            return Task.CompletedTask;
        }

        public Task<AuditAssessmentRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
        {
            if (_assessments.TryGetValue(assessmentId, out AuditAssessmentRecord? assessment) && assessment.TenantId == tenantId)
                return Task.FromResult<AuditAssessmentRecord?>(assessment);

            return Task.FromResult<AuditAssessmentRecord?>(null);
        }

        public Task UpdateStatusAsync(
            Guid tenantId,
            Guid assessmentId,
            AuditAssessmentStatus status,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>(
                _assessments.Values
                    .Where(assessment => assessment.TenantId == tenantId && assessment.Status != AuditAssessmentStatus.Archived)
                    .ToList());
    }

    private sealed class InMemoryAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
    {
        private readonly IReadOnlyList<AuditEvidenceRequirementRecord> _requirements;

        public InMemoryAuditEvidenceRequirementRepository(
            Guid frameworkId,
            Guid tenantId,
            Guid requirementId,
            Guid controlId,
            string evidenceType)
        {
            _requirements =
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    FrameworkId = frameworkId,
                    TenantId = tenantId,
                    ControlId = controlId,
                    EvidenceType = evidenceType,
                    Name = evidenceType,
                },
            ];
        }

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(_requirements);

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
            Guid tenantId,
            Guid controlId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>(
                _requirements.Where(requirement => requirement.ControlId == controlId).ToList());
    }

    private sealed class InMemoryAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
    {
        private readonly Dictionary<Guid, AuditEvidenceSnapshotHeaderRecord> _headers = new();
        private readonly Dictionary<Guid, List<AuditEvidenceSnapshotItemRecord>> _items = new();

        public List<AuditEvidenceFreshnessItemUpdate> FreshnessUpdates { get; } = [];

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
            => Task.FromResult(
                _headers.TryGetValue(auditEvidenceSnapshotId, out AuditEvidenceSnapshotHeaderRecord? header)
                && header.TenantId == tenantId
                    ? header
                    : null);

        public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>(
                _items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items)
                    ? items.Where(item => item.TenantId == tenantId).ToList()
                    : []);

        public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>>(
                _headers.Values
                    .Where(header => header.TenantId == tenantId && header.AssessmentId == assessmentId)
                    .ToList());

        public Task UpdateItemFreshnessAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
            CancellationToken cancellationToken = default)
        {
            FreshnessUpdates.AddRange(updates);

            if (!_items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items))
                return Task.CompletedTask;

            foreach (AuditEvidenceFreshnessItemUpdate update in updates)
            {
                AuditEvidenceSnapshotItemRecord? item = items.FirstOrDefault(row => row.EvidenceRowId == update.EvidenceRowId);

                if (item is null)
                    continue;

                int index = items.IndexOf(item);
                items[index] = new AuditEvidenceSnapshotItemRecord
                {
                    EvidenceRowId = item.EvidenceRowId,
                    AuditEvidenceSnapshotId = item.AuditEvidenceSnapshotId,
                    RequirementId = item.RequirementId,
                    TenantId = item.TenantId,
                    EvidenceType = item.EvidenceType,
                    CollectedUtc = item.CollectedUtc,
                    CollectorVersion = item.CollectorVersion,
                    EvidenceHashSha256 = item.EvidenceHashSha256,
                    CollectionStatus = item.CollectionStatus,
                    FreshnessStatus = update.FreshnessStatus,
                    Confidence = item.Confidence,
                    Summary = item.Summary,
                    ProvenanceKind = item.ProvenanceKind,
                    SelectorVersion = item.SelectorVersion,
                };
            }

            return Task.CompletedTask;
        }

        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
            Guid tenantId,
            Guid assessmentId,
            string baselineName,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditEvidenceBaselineRecord?>(null);

        public Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int take,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>>([]);
    }

    private sealed class CapturingTimelineRepository : IAuditControlTimelineRepository
    {
        public List<AuditControlTechnicalTimelineRecord> Records { get; } = [];

        public Task UpsertAsync(AuditControlTechnicalTimelineRecord record, CancellationToken cancellationToken = default)
        {
            Records.Add(record);
            return Task.CompletedTask;
        }

        public Task<AuditControlTechnicalTimelineRecord?> TryGetLatestAsync(
            Guid tenantId,
            Guid assessmentId,
            Guid controlId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditControlTechnicalTimelineRecord?>(null);
    }

    private sealed class CapturingFindingHandoffService : IAuditEvaluationFindingHandoffService
    {
        public List<AuditEvaluationFindingHandoffRequest> Requests { get; } = [];

        public Task<bool> TryHandoffAsync(
            AuditEvaluationFindingHandoffRequest request,
            CancellationToken cancellationToken = default)
        {
            Requests.Add(request);
            return Task.FromResult(true);
        }
    }
}
