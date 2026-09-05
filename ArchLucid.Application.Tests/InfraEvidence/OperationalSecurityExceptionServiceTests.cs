using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class OperationalSecurityExceptionServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void TryValidateCreateRequest_rejects_missing_rationale()
    {
        DateTime utcNow = DateTime.UtcNow;

        bool valid = OperationalSecurityExceptionGuard.TryValidateCreateRequest(
            new OperationalSecurityExceptionCreateRequest
            {
                FindingId = Guid.NewGuid(),
                OwnerActorKeys = ["owner-1"],
                Rationale = "   ",
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "requester",
                ApprovedByActorKey = "approver",
            },
            utcNow,
            out string? error);

        valid.Should().BeFalse();
        error.Should().Contain("Rationale");
    }

    [Fact]
    public void TryValidateCreateRequest_rejects_same_requester_and_approver()
    {
        DateTime utcNow = DateTime.UtcNow;
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);

        bool valid = OperationalSecurityExceptionGuard.TryValidateCreateRequest(
            new OperationalSecurityExceptionCreateRequest
            {
                CloudResourceId = Guid.NewGuid(),
                OwnerActorKeys = ["owner-1"],
                Rationale = rationale,
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "same-actor",
                ApprovedByActorKey = "same-actor",
            },
            utcNow,
            out string? error);

        valid.Should().BeFalse();
        error.Should().Contain("Approver cannot be the same actor");
    }

    [Fact]
    public async Task SweepExpiredAsync_creates_expiry_observation_and_reopens_finding()
    {
        Guid findingId = Guid.NewGuid();
        Guid exceptionId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(findingId, OperationalSecurityFindingStatus.Exception, utcNow));

        InMemoryOperationalSecurityExceptionRepository exceptionRepository = new();
        exceptionRepository.Records.Add(CreateExpiredException(exceptionId, findingId, utcNow.AddMinutes(-5)));

        OperationalSecurityExceptionService sut = CreateSut(exceptionRepository, findingRepository);

        OperationalSecurityExceptionExpirySweepResult result =
            await sut.SweepExpiredAsync(CreateScope());

        result.ExpiredCount.Should().Be(1);
        result.FindingsReopenedCount.Should().Be(1);
        result.ObservationsCreatedCount.Should().Be(1);

        OperationalSecurityFindingRecord? finding = findingRepository.Findings.Single();
        finding.Status.Should().Be(OperationalSecurityFindingStatus.Open);

        findingRepository.Observations.Should().ContainSingle(observation =>
            observation.SourceSystem == OperationalSecurityExceptionConstants.ExceptionExpirySourceSystem);
    }

    [Fact]
    public async Task SweepExpiredAsync_does_not_create_observation_for_active_exception()
    {
        Guid findingId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(findingId, OperationalSecurityFindingStatus.Exception, utcNow));

        InMemoryOperationalSecurityExceptionRepository exceptionRepository = new();
        exceptionRepository.Records.Add(CreateActiveException(Guid.NewGuid(), findingId, utcNow.AddDays(7)));

        OperationalSecurityExceptionService sut = CreateSut(exceptionRepository, findingRepository);

        OperationalSecurityExceptionExpirySweepResult result =
            await sut.SweepExpiredAsync(CreateScope());

        result.ExpiredCount.Should().Be(0);
        findingRepository.Observations.Should().BeEmpty();
    }

    private static OperationalSecurityExceptionService CreateSut(
        InMemoryOperationalSecurityExceptionRepository exceptionRepository,
        InMemoryOperationalSecurityFindingRepository findingRepository) =>
        new(
            exceptionRepository,
            findingRepository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityExceptionService>.Instance);

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static OperationalSecurityFindingRecord CreateFinding(
        Guid findingId,
        OperationalSecurityFindingStatus status,
        DateTime utcNow) =>
        new()
        {
            FindingId = findingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "Defender",
            SourceFindingId = findingId.ToString("N"),
            Title = "Open storage account",
            Severity = "High",
            FirstObservedUtc = utcNow,
            LastObservedUtc = utcNow,
            Status = status,
            PayloadHashSha256 = [1, 2, 3],
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static OperationalSecurityExceptionRecord CreateExpiredException(
        Guid exceptionId,
        Guid findingId,
        DateTime expirationUtc) =>
        new()
        {
            ExceptionId = exceptionId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            FindingId = findingId,
            OwnerActorKeysJson = "[\"owner-1\"]",
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = expirationUtc,
            Status = OperationalSecurityExceptionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [9, 9, 9],
            CreatedUtc = expirationUtc.AddDays(-30),
            UpdatedUtc = expirationUtc.AddDays(-30),
        };

    private static OperationalSecurityExceptionRecord CreateActiveException(
        Guid exceptionId,
        Guid findingId,
        DateTime expirationUtc) =>
        new()
        {
            ExceptionId = exceptionId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            FindingId = findingId,
            OwnerActorKeysJson = "[\"owner-1\"]",
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = expirationUtc,
            Status = OperationalSecurityExceptionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [8, 8, 8],
            CreatedUtc = expirationUtc.AddDays(-1),
            UpdatedUtc = expirationUtc.AddDays(-1),
        };

    private sealed class InMemoryOperationalSecurityExceptionRepository : IOperationalSecurityExceptionRepository
    {
        public List<OperationalSecurityExceptionRecord> Records { get; } = [];

        public Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default)
        {
            Records.Add(record);
            return Task.CompletedTask;
        }

        public Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid exceptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.FirstOrDefault(record =>
                record.TenantId == tenantId && record.ExceptionId == exceptionId));

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>(
                Records.Where(record => record.TenantId == tenantId).ToList());

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default)
        {
            List<OperationalSecurityExceptionRecord> expired = [];

            for (int index = 0; index < Records.Count; index++)
            {
                OperationalSecurityExceptionRecord record = Records[index];

                if (record.TenantId != tenantId
                    || record.Status != OperationalSecurityExceptionStatus.Active
                    || record.ExpirationUtc >= asOfUtc)
                {
                    continue;
                }

                OperationalSecurityExceptionRecord updated = CloneException(
                    record,
                    status: OperationalSecurityExceptionStatus.Expired,
                    updatedUtc: asOfUtc);

                Records[index] = updated;
                expired.Add(updated);
            }

            return Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>(expired);
        }

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid exceptionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default)
        {
            for (int index = 0; index < Records.Count; index++)
            {
                OperationalSecurityExceptionRecord record = Records[index];

                if (record.TenantId == tenantId && record.ExceptionId == exceptionId)
                {
                    Records[index] = CloneException(record, expiryProcessedUtc: processedUtc, updatedUtc: processedUtc);
                    break;
                }
            }

            return Task.CompletedTask;
        }

        public Task RevokeAsync(
            Guid tenantId,
            Guid exceptionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<bool> HasActiveExceptionForFindingAsync(
            Guid tenantId,
            Guid findingId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.Any(record =>
                record.TenantId == tenantId
                && record.FindingId == findingId
                && record.Status == OperationalSecurityExceptionStatus.Active
                && record.ExpirationUtc > asOfUtc));
    }

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> Findings { get; } = [];

        public List<OperationalSecurityFindingObservationRecord> Observations { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Findings.FirstOrDefault(finding =>
                finding.TenantId == tenantId && finding.FindingId == findingId));

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>(
                Observations.Where(observation =>
                    observation.TenantId == tenantId && observation.FindingId == findingId).ToList());

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
        {
            int index = Findings.FindIndex(existing => existing.FindingId == finding.FindingId);

            if (index >= 0)
                Findings[index] = finding;

            if (observation is not null)
                Observations.Add(observation);

            return Task.CompletedTask;
        }
    }

    private static OperationalSecurityExceptionRecord CloneException(
        OperationalSecurityExceptionRecord source,
        OperationalSecurityExceptionStatus? status = null,
        DateTime? expiryProcessedUtc = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            ExceptionId = source.ExceptionId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            FindingId = source.FindingId,
            PatternId = source.PatternId,
            CloudResourceId = source.CloudResourceId,
            OwnerActorKeysJson = source.OwnerActorKeysJson,
            Rationale = source.Rationale,
            ResidualRisk = source.ResidualRisk,
            CompensatingControls = source.CompensatingControls,
            EvidenceReference = source.EvidenceReference,
            ExpirationUtc = source.ExpirationUtc,
            Status = status ?? source.Status,
            RequestedByActorKey = source.RequestedByActorKey,
            ApprovedByActorKey = source.ApprovedByActorKey,
            PayloadHashSha256 = source.PayloadHashSha256,
            ExpiryProcessedUtc = expiryProcessedUtc ?? source.ExpiryProcessedUtc,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
            RevokedUtc = source.RevokedUtc,
            RevokedByActorKey = source.RevokedByActorKey,
        };
}
