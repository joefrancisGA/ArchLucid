using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditEvidenceLineageServiceTests
{
    [Fact]
    public async Task TryGetControlLineageAsync_two_resources_and_one_exception_returns_all_ids()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid evaluationId = Guid.NewGuid();
        Guid resourceOneId = Guid.NewGuid();
        Guid resourceTwoId = Guid.NewGuid();
        Guid evidenceItemOneId = Guid.NewGuid();
        Guid evidenceItemTwoId = Guid.NewGuid();
        const string exceptionId = "EX-001";

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

        InMemoryAuditFrameworkRepository frameworkRepository = new(frameworkId, scope.TenantId, controlId);
        InMemoryAuditEvidenceRequirementRepository requirementRepository = new(
            frameworkId,
            scope.TenantId,
            requirementId,
            controlId,
            AuditEvidenceTypeNames.Network);

        AuditEvidenceSnapshotItemRecord resourceOne = CreateHashedSnapshotItem(
            Guid.NewGuid(),
            auditEvidenceSnapshotId,
            requirementId,
            scope.TenantId,
            resourceOneId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-1");

        AuditEvidenceSnapshotItemRecord resourceTwo = CreateHashedSnapshotItem(
            Guid.NewGuid(),
            auditEvidenceSnapshotId,
            requirementId,
            scope.TenantId,
            resourceTwoId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-2");

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                EvidenceHashSha256 = AuditEvidenceSnapshotHasher.ComputeRootHash([resourceOne, resourceTwo]),
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items = [resourceOne, resourceTwo],
        });

        InMemoryAuditControlEvaluationRepository evaluationRepository = new();
        evaluationRepository.Evaluation = new AuditControlEvaluationRecord
        {
            EvaluationId = evaluationId,
            ControlId = controlId,
            FrameworkId = frameworkId,
            SnapshotId = auditEvidenceSnapshotId,
            TenantId = scope.TenantId,
            Outcome = AuditEvaluationOutcome.TechnicallySupported,
            PassCount = 2,
            ApplicableCount = 2,
            Confidence = 1.0m,
            EvaluationText = "Supported.",
            Formula = "2/2 pass",
            RequirementIds = [requirementId],
            ExceptionIds = [exceptionId],
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            CreatedUtc = DateTime.UtcNow,
        };

        evaluationRepository.EvidenceItems =
        [
            new AuditEvidenceItemRecord
            {
                EvidenceItemId = evidenceItemOneId,
                EvaluationId = evaluationId,
                RequirementId = requirementId,
                TenantId = scope.TenantId,
                CloudResourceId = resourceOneId,
                AzureResourceId = resourceOne.AzureResourceId,
                EvidenceType = AuditEvidenceTypeNames.Network,
                Summary = "pip-1",
                CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                CreatedUtc = DateTime.UtcNow,
            },
            new AuditEvidenceItemRecord
            {
                EvidenceItemId = evidenceItemTwoId,
                EvaluationId = evaluationId,
                RequirementId = requirementId,
                TenantId = scope.TenantId,
                CloudResourceId = resourceTwoId,
                AzureResourceId = resourceTwo.AzureResourceId,
                EvidenceType = AuditEvidenceTypeNames.Network,
                Summary = "pip-2",
                CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                CreatedUtc = DateTime.UtcNow,
            },
        ];

        Mock<IAuditEvidenceSnapshotVerificationService> verificationService = new();
        verificationService
            .Setup(service => service.TryVerifyAsync(scope.TenantId, auditEvidenceSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuditEvidenceSnapshotVerificationResult { IsValid = true });

        AuditEvidenceLineageService sut = CreateLineageService(
            assessmentRepository,
            frameworkRepository,
            requirementRepository,
            snapshotRepository,
            evaluationRepository,
            verificationService.Object);

        AuditEvidenceLineageQueryResult result = await sut.TryGetControlLineageAsync(
            scope,
            assessmentId,
            auditEvidenceSnapshotId,
            controlId);

        result.Succeeded.Should().BeTrue();
        result.Lineage.Should().NotBeNull();
        result.Lineage!.AssessmentId.Should().Be(assessmentId);
        result.Lineage.AuditEvidenceSnapshotId.Should().Be(auditEvidenceSnapshotId);
        result.Lineage.ControlId.Should().Be(controlId);
        result.Lineage.Evaluation.Should().NotBeNull();
        result.Lineage.Evaluation!.EvaluationId.Should().Be(evaluationId);
        result.Lineage.Evaluation.ExceptionIds.Should().ContainSingle().Which.Should().Be(exceptionId);
        result.Lineage.RequirementChains.Should().ContainSingle();
        result.Lineage.RequirementChains[0].RequirementId.Should().Be(requirementId);
        result.Lineage.RequirementChains[0].Evidence.Should().HaveCount(2);
        result.Lineage.RequirementChains[0].Evidence.Select(evidence => evidence.CloudResourceId)
            .Should().BeEquivalentTo([resourceOneId, resourceTwoId]);
        result.Lineage.RequirementChains[0].Evidence.Select(evidence => evidence.EvaluationEvidenceItemId)
            .Should().BeEquivalentTo([evidenceItemOneId, evidenceItemTwoId]);
        result.Lineage.ChainComplete.Should().BeTrue();
        result.Lineage.ReadyForPositiveCheckbox.Should().BeTrue();
    }

    [Fact]
    public async Task TryGetControlLineageAsync_missing_raw_blob_breaks_hash_and_checkbox()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid evaluationId = Guid.NewGuid();

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

        AuditEvidenceSnapshotItemRecord validItem = CreateHashedSnapshotItem(
            Guid.NewGuid(),
            auditEvidenceSnapshotId,
            requirementId,
            scope.TenantId,
            Guid.NewGuid(),
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-1");

        AuditEvidenceSnapshotItemRecord tamperedItem = new()
        {
            EvidenceRowId = validItem.EvidenceRowId,
            AuditEvidenceSnapshotId = validItem.AuditEvidenceSnapshotId,
            RequirementId = validItem.RequirementId,
            TenantId = validItem.TenantId,
            CloudResourceId = validItem.CloudResourceId,
            AzureResourceId = validItem.AzureResourceId,
            EvidenceType = validItem.EvidenceType,
            CollectedUtc = validItem.CollectedUtc,
            CollectorVersion = validItem.CollectorVersion,
            EvidenceHashSha256 = validItem.EvidenceHashSha256,
            CollectionStatus = validItem.CollectionStatus,
            FreshnessStatus = validItem.FreshnessStatus,
            Confidence = validItem.Confidence,
            Summary = validItem.Summary,
            ProvenanceKind = validItem.ProvenanceKind,
            SelectorVersion = validItem.SelectorVersion,
            NormalizedPointer = validItem.NormalizedPointer,
            ApiQueryId = validItem.ApiQueryId,
            RawPointer = null,
        };

        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                EvidenceHashSha256 = AuditEvidenceSnapshotHasher.ComputeRootHash([tamperedItem]),
                CollectionStartedUtc = DateTime.UtcNow,
                CollectionCompletedUtc = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
            },
            Items = [tamperedItem],
        });

        InMemoryAuditControlEvaluationRepository evaluationRepository = new();
        evaluationRepository.Evaluation = new AuditControlEvaluationRecord
        {
            EvaluationId = evaluationId,
            ControlId = controlId,
            FrameworkId = frameworkId,
            SnapshotId = auditEvidenceSnapshotId,
            TenantId = scope.TenantId,
            Outcome = AuditEvaluationOutcome.TechnicallySupported,
            PassCount = 1,
            ApplicableCount = 1,
            Confidence = 1.0m,
            EvaluationText = "Supported.",
            Formula = "1/1 pass",
            RequirementIds = [requirementId],
            ExceptionIds = [],
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAuditEvidenceSnapshotVerificationService> verificationService = new();
        verificationService
            .Setup(service => service.TryVerifyAsync(scope.TenantId, auditEvidenceSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuditEvidenceSnapshotVerificationResult
            {
                IsValid = false,
                FailureReason = "Evidence row hash does not match stored hash.",
            });

        AuditEvidenceLineageService sut = CreateLineageService(
            assessmentRepository,
            new InMemoryAuditFrameworkRepository(frameworkId, scope.TenantId, controlId),
            new InMemoryAuditEvidenceRequirementRepository(
                frameworkId,
                scope.TenantId,
                requirementId,
                controlId,
                AuditEvidenceTypeNames.Network),
            snapshotRepository,
            evaluationRepository,
            verificationService.Object);

        AuditEvidenceLineageQueryResult result = await sut.TryGetControlLineageAsync(
            scope,
            assessmentId,
            auditEvidenceSnapshotId,
            controlId);

        result.Succeeded.Should().BeTrue();
        result.Lineage.Should().NotBeNull();
        result.Lineage!.SnapshotHashVerified.Should().BeFalse();
        result.Lineage.ChainComplete.Should().BeFalse();
        result.Lineage.ReadyForPositiveCheckbox.Should().BeFalse();
        result.Lineage.BrokenLinkReasons.Should().NotBeEmpty();
        result.Lineage.RequirementChains[0].Evidence[0].MissingLinkKinds.Should().Contain("RawApiBlob");
        result.Lineage.RequirementChains[0].Evidence[0].ItemHashVerified.Should().BeFalse();
    }

    [Fact]
    public async Task TryGetControlLineageAsync_wrong_tenant_returns_not_found()
    {
        Guid ownerTenantId = Guid.NewGuid();
        ScopeContext otherTenantScope = new() { TenantId = Guid.NewGuid() };

        InMemoryAuditAssessmentRepository assessmentRepository = new();
        Guid assessmentId = Guid.NewGuid();
        await assessmentRepository.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentId,
            TenantId = ownerTenantId,
            FrameworkId = Guid.NewGuid(),
            Status = AuditAssessmentStatus.Collecting,
            FrameworkVersion = "1.0",
            ScopeJson = "{}",
            RequestedBy = "test",
            CreatedUtc = DateTime.UtcNow,
        });

        AuditEvidenceLineageService sut = CreateLineageService(
            assessmentRepository,
            new InMemoryAuditFrameworkRepository(Guid.NewGuid(), ownerTenantId, Guid.NewGuid()),
            new InMemoryAuditEvidenceRequirementRepository(
                Guid.NewGuid(),
                ownerTenantId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                AuditEvidenceTypeNames.Inventory),
            new InMemoryAuditEvidenceSnapshotRepository(),
            new InMemoryAuditControlEvaluationRepository(),
            Mock.Of<IAuditEvidenceSnapshotVerificationService>());

        AuditEvidenceLineageQueryResult result = await sut.TryGetControlLineageAsync(
            otherTenantScope,
            assessmentId,
            Guid.NewGuid(),
            Guid.NewGuid());

        result.Succeeded.Should().BeFalse();
        result.Lineage.Should().BeNull();
        result.ErrorMessage.Should().Contain("Assessment was not found");
    }

    private static AuditEvidenceLineageService CreateLineageService(
        IAuditAssessmentRepository assessmentRepository,
        IAuditFrameworkRepository frameworkRepository,
        IAuditEvidenceRequirementRepository requirementRepository,
        IAuditEvidenceSnapshotRepository snapshotRepository,
        IAuditControlEvaluationRepository evaluationRepository,
        IAuditEvidenceSnapshotVerificationService verificationService)
    {
        Mock<IAuditManualEvidenceRepository> manualEvidenceRepository = new();
        manualEvidenceRepository
            .Setup(repository => repository.ListArchitectureLinksByControlAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return new AuditEvidenceLineageService(
            assessmentRepository,
            frameworkRepository,
            requirementRepository,
            snapshotRepository,
            evaluationRepository,
            manualEvidenceRepository.Object,
            verificationService,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<AuditEvidenceLineageService>.Instance);
    }

    private static AuditEvidenceSnapshotItemRecord CreateHashedSnapshotItem(
        Guid evidenceRowId,
        Guid auditEvidenceSnapshotId,
        Guid requirementId,
        Guid tenantId,
        Guid cloudResourceId,
        string azureResourceId)
    {
        AuditEvidenceSnapshotItemRecord seed = new()
        {
            EvidenceRowId = evidenceRowId,
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
            RequirementId = requirementId,
            TenantId = tenantId,
            CloudResourceId = cloudResourceId,
            AzureResourceId = azureResourceId,
            EvidenceType = AuditEvidenceTypeNames.Network,
            CollectedUtc = DateTime.UtcNow,
            CollectorVersion = "1.0.0",
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
            Confidence = 1.0m,
            Summary = "network evidence",
            ProvenanceKind = ProvenanceKind.ObservedFact,
            SelectorVersion = "1.0.0",
            NormalizedPointer = "normalized://network/pip",
            RawPointer = "blob://raw/network/pip.json",
            ApiQueryId = "Microsoft.Network/publicIPAddresses/read",
            EvidenceHashSha256 = [],
        };

        byte[] hash = AuditEvidenceSnapshotHasher.ComputeItemHash(seed);

        return new AuditEvidenceSnapshotItemRecord
        {
            EvidenceRowId = seed.EvidenceRowId,
            AuditEvidenceSnapshotId = seed.AuditEvidenceSnapshotId,
            RequirementId = seed.RequirementId,
            TenantId = seed.TenantId,
            CloudResourceId = seed.CloudResourceId,
            AzureResourceId = seed.AzureResourceId,
            EvidenceType = seed.EvidenceType,
            CollectedUtc = seed.CollectedUtc,
            CollectorVersion = seed.CollectorVersion,
            CollectionStatus = seed.CollectionStatus,
            FreshnessStatus = seed.FreshnessStatus,
            Confidence = seed.Confidence,
            Summary = seed.Summary,
            ProvenanceKind = seed.ProvenanceKind,
            SelectorVersion = seed.SelectorVersion,
            NormalizedPointer = seed.NormalizedPointer,
            RawPointer = seed.RawPointer,
            ApiQueryId = seed.ApiQueryId,
            EvidenceHashSha256 = hash,
        };
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
            => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>([]);
    }

    private sealed class InMemoryAuditFrameworkRepository : IAuditFrameworkRepository
    {
        private readonly Guid _frameworkId;
        private readonly Guid _tenantId;
        private readonly Guid _controlId;

        public InMemoryAuditFrameworkRepository(Guid frameworkId, Guid tenantId, Guid controlId)
        {
            _frameworkId = frameworkId;
            _tenantId = tenantId;
            _controlId = controlId;
        }

        public Task<AuditFrameworkImportResult> ImportAsync(
            Guid tenantId,
            AuditFrameworkRecord framework,
            IReadOnlyList<AuditControlRecord> controls,
            IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
            IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new AuditFrameworkImportResult { Succeeded = true });

        public Task<AuditFrameworkRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AuditFrameworkRecord?>(null);

        public Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default)
        {
            if (tenantId != _tenantId || frameworkId != _frameworkId)
                return Task.FromResult<IReadOnlyList<AuditControlRecord>>([]);

            return Task.FromResult<IReadOnlyList<AuditControlRecord>>(
            [
                new AuditControlRecord
                {
                    ControlId = _controlId,
                    FrameworkId = _frameworkId,
                    TenantId = _tenantId,
                    ControlNumber = "AC-1",
                    Title = "Access control",
                },
            ]);
        }
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

        public Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int take,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>>([]);
    }

    private sealed class InMemoryAuditControlEvaluationRepository : IAuditControlEvaluationRepository
    {
        public AuditControlEvaluationRecord? Evaluation
        {
            get;
            set;
        }

        public IReadOnlyList<AuditEvidenceItemRecord> EvidenceItems
        {
            get;
            set;
        } = [];

        public Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
            Guid tenantId,
            Guid controlId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(
                Evaluation is not null
                && Evaluation.TenantId == tenantId
                && Evaluation.ControlId == controlId
                && Evaluation.SnapshotId == snapshotId
                    ? Evaluation
                    : null);

        public Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
            Guid tenantId,
            Guid evaluationId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AuditEvidenceItemRecord>>(
                EvidenceItems.Where(item => item.TenantId == tenantId && item.EvaluationId == evaluationId).ToList());
    }
}
