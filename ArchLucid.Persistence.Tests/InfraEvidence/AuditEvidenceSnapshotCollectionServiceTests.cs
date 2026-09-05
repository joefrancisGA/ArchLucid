using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class AuditEvidenceSnapshotCollectionServiceTests
{
    [Fact]
    public async Task TryCollectSnapshotAsync_second_collection_creates_new_snapshot_id()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid frameworkId = Guid.NewGuid();
        Guid inventorySnapshotId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        InMemoryAuditAssessmentRepository assessmentRepository = new();
        InMemoryAuditFrameworkRepository frameworkRepository = new(frameworkId, scope.TenantId);
        InMemoryInventorySnapshotRepository inventoryRepository = new(inventorySnapshotId);
        InMemoryAuditEvidenceRequirementRepository requirementRepository = new(frameworkId, scope.TenantId, requirementId);
        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();

        AuditEvidenceSelectorRegistry selectorRegistry = AuditEvidenceSelectionServiceTestsSupport.BuildRegistry();

        AuditEvidenceSelectionService selectionService = new(
            inventoryRepository,
            requirementRepository,
            selectorRegistry,
            NullLogger<AuditEvidenceSelectionService>.Instance);

        AuditEvidenceSnapshotCollectionService service = new(
            assessmentRepository,
            frameworkRepository,
            inventoryRepository,
            selectionService,
            selectorRegistry,
            snapshotRepository,
            NullLogger<AuditEvidenceSnapshotCollectionService>.Instance);

        AuditAssessmentCreateResult assessmentResult = await service.TryCreateAssessmentAsync(
            scope,
            frameworkId,
            "auditor@example.com",
            ["sub-1"],
            null,
            null);

        assessmentResult.Succeeded.Should().BeTrue();
        Guid assessmentId = assessmentResult.AssessmentId!.Value;

        AuditEvidenceSnapshotCollectionResult first = await service.TryCollectSnapshotAsync(
            scope,
            assessmentId,
            [inventorySnapshotId]);

        AuditEvidenceSnapshotCollectionResult second = await service.TryCollectSnapshotAsync(
            scope,
            assessmentId,
            [inventorySnapshotId]);

        first.Succeeded.Should().BeTrue();
        second.Succeeded.Should().BeTrue();
        second.AuditEvidenceSnapshotId.Should().NotBeNull();
        first.AuditEvidenceSnapshotId.Should().NotBeNull();
        second.AuditEvidenceSnapshotId!.Value.Should().NotBe(first.AuditEvidenceSnapshotId!.Value);

        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots =
            await snapshotRepository.ListByAssessmentAsync(scope.TenantId, assessmentId);

        snapshots.Should().HaveCount(2);
    }

    [Fact]
    public async Task ListSnapshotsAsync_baseline_mode_returns_named_snapshot_only()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        InMemoryAuditAssessmentRepository assessmentRepository = new();

        await assessmentRepository.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FrameworkId = Guid.NewGuid(),
            FrameworkVersion = "1.0",
            Status = AuditAssessmentStatus.Complete,
            RequestedBy = "auditor@example.com",
            CreatedUtc = DateTime.UtcNow,
        });

        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = snapshotId,
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                EvidenceHashSha256 = [1, 2, 3],
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items = [],
        });

        await snapshotRepository.InsertBaselineAsync(new AuditEvidenceBaselineRecord
        {
            BaselineId = Guid.NewGuid(),
            AssessmentId = assessmentId,
            AuditEvidenceSnapshotId = snapshotId,
            TenantId = scope.TenantId,
            Name = "period-open",
            DesignatedBy = "auditor@example.com",
            DesignatedUtc = DateTime.UtcNow,
        });

        AuditEvidenceSnapshotQueryService queryService = new(assessmentRepository, snapshotRepository);

        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> baselineSnapshots =
            await queryService.ListSnapshotsAsync(scope, assessmentId, AuditEvidenceReadMode.Baseline, "period-open");

        baselineSnapshots.Should().ContainSingle();
        baselineSnapshots[0].AuditEvidenceSnapshotId.Should().Be(snapshotId);
    }

    internal sealed class InMemoryAuditAssessmentRepository : IAuditAssessmentRepository
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
        {
            if (_assessments.TryGetValue(assessmentId, out AuditAssessmentRecord? assessment) && assessment.TenantId == tenantId)
            {
                _assessments[assessmentId] = new AuditAssessmentRecord
                {
                    AssessmentId = assessment.AssessmentId,
                    TenantId = assessment.TenantId,
                    WorkspaceId = assessment.WorkspaceId,
                    ProjectId = assessment.ProjectId,
                    FrameworkId = assessment.FrameworkId,
                    FrameworkVersion = assessment.FrameworkVersion,
                    ScopeJson = assessment.ScopeJson,
                    PeriodStartUtc = assessment.PeriodStartUtc,
                    PeriodEndUtc = assessment.PeriodEndUtc,
                    Status = status,
                    RequestedBy = assessment.RequestedBy,
                    CreatedUtc = assessment.CreatedUtc,
                };
            }

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>(
                _assessments.Values
                    .Where(assessment => assessment.TenantId == tenantId && assessment.Status != AuditAssessmentStatus.Archived)
                    .ToList());
    }

    internal sealed class InMemoryAuditFrameworkRepository : IAuditFrameworkRepository
    {
        private readonly AuditFrameworkRecord _framework;

        public InMemoryAuditFrameworkRepository(Guid frameworkId, Guid tenantId)
        {
            _framework = new AuditFrameworkRecord
            {
                FrameworkId = frameworkId,
                TenantId = tenantId,
                Name = "EXAMPLE",
                Version = "2026.09.04-example",
                SourceReference = "synthetic-fixture://example",
                Status = AuditFrameworkStatus.Active,
                ContentHashSha256 = [9, 9, 9],
                SpecBlob = [1],
                CreatedUtc = DateTime.UtcNow,
            };
        }

        public Task<AuditFrameworkImportResult> ImportAsync(
            Guid tenantId,
            AuditFrameworkRecord framework,
            IReadOnlyList<AuditControlRecord> controls,
            IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
            IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<AuditFrameworkRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditFrameworkRecord?>(
                _framework.FrameworkId == frameworkId && _framework.TenantId == tenantId ? _framework : null);

        public Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditControlRecord>>([]);
    }

    internal sealed class InMemoryInventorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        private readonly Guid _snapshotId;

        public InMemoryInventorySnapshotRepository(Guid snapshotId) => _snapshotId = snapshotId;

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            if (snapshotId != _snapshotId)
                return Task.FromResult<AzureInventorySnapshotRecord?>(null);

            return Task.FromResult<AzureInventorySnapshotRecord?>(new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub-1",
                CollectorVersion = "1.0.0",
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });
        }

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            if (snapshotId != _snapshotId)
                return Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

            return Task.FromResult<AzureInventorySnapshotDetailReadModel?>(new AzureInventorySnapshotDetailReadModel
            {
                Header = new AzureInventorySnapshotRecord
                {
                    SnapshotId = snapshotId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    PackageId = Guid.NewGuid(),
                    SubscriptionId = "sub-1",
                },
                Resources =
                [
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = Guid.NewGuid(),
                        AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                        ResourceType = "Microsoft.Storage/storageAccounts",
                    },
                ],
            });
        }

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord header, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<Guid?>(null);
    }

    internal sealed class InMemoryAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
    {
        private readonly List<AuditEvidenceRequirementRecord> _requirements;

        public InMemoryAuditEvidenceRequirementRepository(Guid frameworkId, Guid tenantId, Guid requirementId)
        {
            _requirements =
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    FrameworkId = frameworkId,
                    ControlId = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = "Inventory coverage",
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
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
            => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>([]);
    }

    internal sealed class InMemoryAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
    {
        private readonly Dictionary<Guid, AuditEvidenceSnapshotHeaderRecord> _headers = new();
        private readonly Dictionary<Guid, List<AuditEvidenceSnapshotItemRecord>> _items = new();
        private readonly List<AuditEvidenceBaselineRecord> _baselines = [];

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
        {
            IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots = _headers.Values
                .Where(header => header.TenantId == tenantId && header.AssessmentId == assessmentId)
                .OrderByDescending(header => header.CollectionCompletedUtc)
                .ToList();

            return Task.FromResult(snapshots);
        }

        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
        {
            _baselines.Add(baseline);
            return Task.CompletedTask;
        }

        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
            Guid tenantId,
            Guid assessmentId,
            string baselineName,
            CancellationToken cancellationToken = default)
        {
            AuditEvidenceBaselineRecord? baseline = _baselines.FirstOrDefault(
                row => row.TenantId == tenantId
                    && row.AssessmentId == assessmentId
                    && string.Equals(row.Name, baselineName, StringComparison.Ordinal));

            return Task.FromResult(baseline);
        }

        public Task UpdateItemFreshnessAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
            CancellationToken cancellationToken = default)
        {
            if (!_items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items))
                return Task.CompletedTask;

            foreach (AuditEvidenceFreshnessItemUpdate update in updates)
            {
                int index = items.FindIndex(item => item.EvidenceRowId == update.EvidenceRowId);

                if (index < 0)
                    continue;

                AuditEvidenceSnapshotItemRecord existing = items[index];
                items[index] = CopyItemWithFreshness(existing, update.FreshnessStatus);
            }

            return Task.CompletedTask;
        }

        private static AuditEvidenceSnapshotItemRecord CopyItemWithFreshness(
            AuditEvidenceSnapshotItemRecord source,
            AuditEvidenceFreshnessStatus freshnessStatus) =>
            new()
            {
                EvidenceRowId = source.EvidenceRowId,
                AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
                RequirementId = source.RequirementId,
                TenantId = source.TenantId,
                CloudResourceId = source.CloudResourceId,
                AzureResourceId = source.AzureResourceId,
                EvidenceType = source.EvidenceType,
                CollectedUtc = source.CollectedUtc,
                CollectorVersion = source.CollectorVersion,
                NormalizedPointer = source.NormalizedPointer,
                RawPointer = source.RawPointer,
                EvidenceHashSha256 = source.EvidenceHashSha256,
                CollectionStatus = source.CollectionStatus,
                FreshnessStatus = freshnessStatus,
                Confidence = source.Confidence,
                Summary = source.Summary,
                ProvenanceKind = source.ProvenanceKind,
                SelectorVersion = source.SelectorVersion,
                AzureScope = source.AzureScope,
                ApiQueryId = source.ApiQueryId,
            };
    }
}

internal static class AuditEvidenceSelectionServiceTestsSupport
{
    public static AuditEvidenceSelectorRegistry BuildRegistry() =>
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
