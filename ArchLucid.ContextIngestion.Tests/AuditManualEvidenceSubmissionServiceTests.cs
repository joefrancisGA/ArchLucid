using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "ContextIngestion")]
public sealed class AuditManualEvidenceSubmissionServiceTests
{
    [Fact]
    public async Task TrySubmitAsync_agent_actor_cannot_insert_policy_row()
    {
        Guid tenantId = Guid.NewGuid();
        Guid assessmentId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        InMemoryAuditManualEvidenceRepository repository = new();
        TestScopeContextProvider scopeProvider = new(new ScopeContext { TenantId = tenantId });
        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActorId()).Returns("agent:loop-runner");
        actor.Setup(context => context.GetActor()).Returns("agent:loop-runner");

        AuditManualEvidenceSubmissionService service = BuildService(
            scopeProvider,
            actor.Object,
            repository,
            requirements:
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    ControlId = controlId,
                    ManualEvidenceAllowed = true,
                },
            ],
            assessment: new AuditAssessmentRecord
            {
                AssessmentId = assessmentId,
                TenantId = tenantId,
                FrameworkId = Guid.NewGuid(),
            });

        AuditManualEvidenceSubmitResult result = await service.TrySubmitAsync(new AuditManualEvidenceSubmitRequest
        {
            AssessmentId = assessmentId,
            ControlId = controlId,
            RequirementId = requirementId,
            Owner = "security-team",
            DocumentKind = AuditManualEvidenceDocumentKind.Policy,
            Content = "Access control policy v1",
        });

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Agent and LLM actors");
        repository.Submissions.Should().BeEmpty();
    }

    [Fact]
    public async Task TrySubmitAsync_human_actor_persists_hashed_submission()
    {
        Guid tenantId = Guid.NewGuid();
        Guid assessmentId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        InMemoryAuditManualEvidenceRepository repository = new();
        TestScopeContextProvider scopeProvider = new(new ScopeContext { TenantId = tenantId });
        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActorId()).Returns("jwt:tenant:user");
        actor.Setup(context => context.GetActor()).Returns("reviewer@example.com");
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns("reviewer@example.com");

        AuditManualEvidenceSubmissionService service = BuildService(
            scopeProvider,
            actor.Object,
            repository,
            requirements:
            [
                new AuditEvidenceRequirementRecord
                {
                    RequirementId = requirementId,
                    ControlId = controlId,
                    ManualEvidenceAllowed = true,
                },
            ],
            assessment: new AuditAssessmentRecord
            {
                AssessmentId = assessmentId,
                TenantId = tenantId,
                FrameworkId = Guid.NewGuid(),
            });

        AuditManualEvidenceSubmitResult result = await service.TrySubmitAsync(new AuditManualEvidenceSubmitRequest
        {
            AssessmentId = assessmentId,
            ControlId = controlId,
            RequirementId = requirementId,
            Owner = "security-team",
            DocumentKind = AuditManualEvidenceDocumentKind.Policy,
            Content = "Access control policy v1",
            ExpirationUtc = DateTime.UtcNow.AddYears(1),
        });

        result.Succeeded.Should().BeTrue();
        repository.Submissions.Should().HaveCount(1);
        repository.Submissions[0].EvidenceHashSha256.Should().NotBeEmpty();
        repository.Submissions[0].ProvenanceKind.Should().Be(ProvenanceKind.HumanAssertion);
        repository.Submissions[0].BlobPointer.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ListByAssessmentAsync_enforces_tenant_isolation()
    {
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        Guid assessmentId = Guid.NewGuid();
        InMemoryAuditManualEvidenceRepository repository = new();

        await repository.InsertSubmissionAsync(new AuditManualEvidenceSubmissionRecord
        {
            SubmissionId = Guid.NewGuid(),
            TenantId = tenantA,
            AssessmentId = assessmentId,
            ControlId = Guid.NewGuid(),
            RequirementId = Guid.NewGuid(),
            Owner = "owner",
            SubmittedBy = "reviewer@example.com",
            SubmittedUtc = DateTime.UtcNow,
            DocumentKind = AuditManualEvidenceDocumentKind.Policy,
            EvidenceHashSha256 = [1, 2, 3],
            BlobPointer = "file://policy",
            ReviewStatus = AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        });

        IReadOnlyList<AuditManualEvidenceSubmissionRecord> tenantBRows =
            await repository.ListByAssessmentAsync(tenantB, assessmentId);

        tenantBRows.Should().BeEmpty();
    }

    [Fact]
    public async Task Hybrid_query_lists_automated_manual_and_architecture_sources()
    {
        Guid tenantId = Guid.NewGuid();
        Guid assessmentId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();

        InMemoryAuditManualEvidenceRepository manualRepository = new();
        InMemoryAuditEvidenceSnapshotRepository snapshotRepository = new();
        InMemoryAuditEvidenceRequirementRepository requirementRepository = new();

        requirementRepository.Requirements.Add(new AuditEvidenceRequirementRecord
        {
            RequirementId = requirementId,
            ControlId = controlId,
            ManualEvidenceAllowed = true,
        });

        await snapshotRepository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = snapshotId,
                AssessmentId = assessmentId,
                TenantId = tenantId,
                InventorySnapshotIds = [],
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
                    AuditEvidenceSnapshotId = snapshotId,
                    RequirementId = requirementId,
                    TenantId = tenantId,
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    CollectedUtc = DateTime.UtcNow,
                    CollectorVersion = "1.0.0",
                    EvidenceHashSha256 = [2],
                    CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                    FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
                    Confidence = 1.0m,
                    Summary = "automated inventory",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    SelectorVersion = "1.0.0",
                },
            ],
        });

        await manualRepository.InsertSubmissionAsync(new AuditManualEvidenceSubmissionRecord
        {
            SubmissionId = Guid.NewGuid(),
            TenantId = tenantId,
            AssessmentId = assessmentId,
            ControlId = controlId,
            RequirementId = requirementId,
            Owner = "owner",
            SubmittedBy = "reviewer@example.com",
            SubmittedUtc = DateTime.UtcNow,
            DocumentKind = AuditManualEvidenceDocumentKind.Policy,
            EvidenceHashSha256 = [3],
            BlobPointer = "file://policy",
            ReviewStatus = AuditEvidenceReviewStatus.Approved,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
            ExpirationUtc = DateTime.UtcNow.AddYears(1),
        });

        await manualRepository.InsertArchitectureLinkAsync(new AuditArchitectureEvidenceLinkRecord
        {
            LinkId = Guid.NewGuid(),
            TenantId = tenantId,
            AssessmentId = assessmentId,
            ControlId = controlId,
            RequirementId = requirementId,
            RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(),
            LinkedBy = "reviewer@example.com",
            LinkedUtc = DateTime.UtcNow,
        });

        AuditHybridEvidenceQueryService hybridService = new(
            snapshotRepository,
            manualRepository,
            requirementRepository,
            NullLogger<AuditHybridEvidenceQueryService>.Instance);

        AuditHybridControlEvidenceRecord? hybrid = await hybridService.TryGetControlEvidenceSourcesAsync(
            tenantId,
            assessmentId,
            controlId,
            snapshotId);

        hybrid.Should().NotBeNull();
        hybrid!.SourceKinds.Should().BeEquivalentTo(
        [
            AuditEvidenceSourceKind.Automated,
            AuditEvidenceSourceKind.Manual,
            AuditEvidenceSourceKind.Architecture,
        ]);
    }

    private static AuditManualEvidenceSubmissionService BuildService(
        TestScopeContextProvider scopeProvider,
        IActorContext actor,
        InMemoryAuditManualEvidenceRepository repository,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
        AuditAssessmentRecord assessment)
    {
        InMemoryAuditEvidenceRequirementRepository requirementRepository = new();
        requirementRepository.Requirements.AddRange(requirements);

        InMemoryAuditAssessmentRepository assessmentRepository = new();
        assessmentRepository.Assessments[assessment.AssessmentId] = assessment;

        return new AuditManualEvidenceSubmissionService(
            scopeProvider,
            actor,
            repository,
            requirementRepository,
            assessmentRepository,
            new InMemoryArtifactBlobStore(),
            NullLogger<AuditManualEvidenceSubmissionService>.Instance);
    }

    private sealed class TestScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }

    private sealed class InMemoryArtifactBlobStore : IArtifactBlobStore
    {
        public Task<string> WriteAsync(string containerName, string blobName, string content, CancellationToken ct) =>
            Task.FromResult($"file://{containerName}/{blobName}");

        public Task<string?> ReadAsync(string blobUri, CancellationToken ct) =>
            Task.FromResult<string?>(null);

        public Task<string?> TryGetExistingUriAsync(string containerName, string logicalBlobName, CancellationToken ct) =>
            Task.FromResult<string?>(null);
    }

    private sealed class InMemoryAuditManualEvidenceRepository : IAuditManualEvidenceRepository
    {
        public List<AuditManualEvidenceSubmissionRecord> Submissions
        {
            get;
        } = [];

        public List<AuditArchitectureEvidenceLinkRecord> ArchitectureLinks
        {
            get;
        } = [];

        public Task InsertSubmissionAsync(
            AuditManualEvidenceSubmissionRecord submission,
            CancellationToken cancellationToken = default)
        {
            Submissions.Add(submission);

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>(
                Submissions
                    .Where(submission => submission.TenantId == tenantId && submission.AssessmentId == assessmentId)
                    .ToList());

        public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
            Guid tenantId,
            Guid assessmentId,
            Guid controlId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>(
                Submissions
                    .Where(submission =>
                        submission.TenantId == tenantId
                        && submission.AssessmentId == assessmentId
                        && submission.ControlId == controlId)
                    .ToList());

        public Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid submissionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                Submissions.FirstOrDefault(submission =>
                    submission.TenantId == tenantId && submission.SubmissionId == submissionId));

        public Task InsertArchitectureLinkAsync(
            AuditArchitectureEvidenceLinkRecord link,
            CancellationToken cancellationToken = default)
        {
            ArchitectureLinks.Add(link);

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>(
                ArchitectureLinks
                    .Where(link => link.TenantId == tenantId && link.AssessmentId == assessmentId)
                    .ToList());

        public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
            Guid tenantId,
            Guid assessmentId,
            Guid controlId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>(
                ArchitectureLinks
                    .Where(link =>
                        link.TenantId == tenantId
                        && link.AssessmentId == assessmentId
                        && link.ControlId == controlId)
                    .ToList());
    }

    private sealed class InMemoryAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
    {
        public List<AuditEvidenceRequirementRecord> Requirements
        {
            get;
        } = [];

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
            Guid tenantId,
            Guid frameworkId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>(Requirements);

        public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
            Guid tenantId,
            Guid controlId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>(
                Requirements.Where(requirement => requirement.ControlId == controlId).ToList());
    }

    private sealed class InMemoryAuditAssessmentRepository : IAuditAssessmentRepository
    {
        public Dictionary<Guid, AuditAssessmentRecord> Assessments
        {
            get;
        } = [];

        public Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default)
        {
            Assessments[assessment.AssessmentId] = assessment;

            return Task.CompletedTask;
        }

        public Task<AuditAssessmentRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                Assessments.TryGetValue(assessmentId, out AuditAssessmentRecord? assessment)
                && assessment.TenantId == tenantId
                    ? assessment
                    : null);

        public Task UpdateStatusAsync(
            Guid tenantId,
            Guid assessmentId,
            AuditAssessmentStatus status,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>(
                Assessments.Values
                    .Where(assessment => assessment.TenantId == tenantId && assessment.Status != AuditAssessmentStatus.Archived)
                    .ToList());
    }

    private sealed class InMemoryAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
    {
        private readonly Dictionary<Guid, AuditEvidenceSnapshotHeaderRecord> _headers = [];
        private readonly Dictionary<Guid, List<AuditEvidenceSnapshotItemRecord>> _items = [];

        public Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
        {
            _headers[request.Header.AuditEvidenceSnapshotId] = request.Header;
            _items[request.Header.AuditEvidenceSnapshotId] = request.Items.ToList();

            return Task.CompletedTask;
        }

        public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                _headers.TryGetValue(auditEvidenceSnapshotId, out AuditEvidenceSnapshotHeaderRecord? header)
                && header.TenantId == tenantId
                    ? header
                    : null);

        public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>(
                _items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items)
                    ? items.Where(item => item.TenantId == tenantId).ToList()
                    : []);

        public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>>(
                _headers.Values
                    .Where(header => header.TenantId == tenantId && header.AssessmentId == assessmentId)
                    .ToList());

        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
            Guid tenantId,
            Guid assessmentId,
            string baselineName,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<AuditEvidenceBaselineRecord?>(null);

        public Task UpdateItemFreshnessAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
