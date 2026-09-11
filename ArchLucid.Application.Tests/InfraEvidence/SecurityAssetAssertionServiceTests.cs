using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
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
public sealed class SecurityAssetAssertionServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid CloudResourceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public void TryValidateCreateRequest_rejects_missing_expiration()
    {
        DateTime utcNow = DateTime.UtcNow;
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);

        bool valid = SecurityAssetAssertionGuard.TryValidateCreateRequest(
            new SecurityAssetAssertionCreateRequest
            {
                CloudResourceId = CloudResourceId,
                Rationale = rationale,
                ExpirationUtc = default,
                RequestedByActorKey = "requester",
                ApprovedByActorKey = "approver",
            },
            utcNow,
            out string? error);

        valid.Should().BeFalse();
        error.Should().Contain("ExpirationUtc");
    }

    [Fact]
    public void TryValidateCreateRequest_rejects_same_requester_and_approver()
    {
        DateTime utcNow = DateTime.UtcNow;
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);

        bool valid = SecurityAssetAssertionGuard.TryValidateCreateRequest(
            new SecurityAssetAssertionCreateRequest
            {
                CloudResourceId = CloudResourceId,
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
    public async Task CreateAsync_rejects_when_active_assertion_exists_for_resource()
    {
        DateTime utcNow = DateTime.UtcNow;
        InMemorySecurityAssetAssertionRepository repository = new();
        repository.Records.Add(CreateActiveAssertion(Guid.NewGuid(), utcNow.AddDays(10)));

        SecurityAssetAssertionService sut = CreateSut(repository, new InMemoryOperationalSecurityFindingRepository());

        SecurityAssetAssertionCreateResult result = await sut.CreateAsync(
            CreateScope(),
            CreateValidCreateRequest(utcNow));

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("active asset assertion");
    }

    [Fact]
    public async Task SweepExpiredAsync_creates_expiry_observation_for_linked_finding()
    {
        Guid assertionId = Guid.NewGuid();
        Guid findingId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        InMemorySecurityAssetAssertionRepository repository = new();
        repository.Records.Add(CreateExpiredAssertion(assertionId, utcNow.AddMinutes(-5)));

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(findingId, utcNow));

        SecurityAssetAssertionService sut = CreateSut(repository, findingRepository);

        SecurityAssetAssertionExpirySweepResult result =
            await sut.SweepExpiredAsync(CreateScope());

        result.ExpiredCount.Should().Be(1);
        result.ObservationsCreatedCount.Should().Be(1);

        findingRepository.Observations.Should().ContainSingle(observation =>
            observation.SourceSystem == SecurityAssetAssertionConstants.AssertionExpirySourceSystem);
    }

    [Fact]
    public async Task RevokeAsync_rejects_cross_tenant_lookup()
    {
        DateTime utcNow = DateTime.UtcNow;
        Guid assertionId = Guid.NewGuid();

        InMemorySecurityAssetAssertionRepository repository = new();
        repository.Records.Add(CreateActiveAssertion(assertionId, utcNow.AddDays(10)));

        SecurityAssetAssertionService sut = CreateSut(repository, new InMemoryOperationalSecurityFindingRepository());

        SecurityAssetAssertionRevokeResult result = await sut.RevokeAsync(
            new ScopeContext
            {
                TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
            },
            assertionId,
            "revoker");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    private static SecurityAssetAssertionService CreateSut(
        InMemorySecurityAssetAssertionRepository repository,
        InMemoryOperationalSecurityFindingRepository findingRepository) =>
        new(
            repository,
            findingRepository,
            Mock.Of<IAuditService>(),
            NullLogger<SecurityAssetAssertionService>.Instance);

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static SecurityAssetAssertionCreateRequest CreateValidCreateRequest(DateTime utcNow) =>
        new()
        {
            CloudResourceId = CloudResourceId,
            DataSensitivity = SecurityAssetDataSensitivity.Phi,
            RegulatoryClass = SecurityAssetRegulatoryClass.Hipaa,
            DeploymentEnvironment = SecurityAssetDeploymentEnvironment.Production,
            BusinessCriticality = SecurityAssetBusinessCriticality.CrownJewel,
            IsPatientImpact = true,
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = utcNow.AddDays(30),
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
        };

    private static SecurityAssetAssertionRecord CreateActiveAssertion(Guid assertionId, DateTime expirationUtc) =>
        new()
        {
            AssertionId = assertionId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CloudResourceId = CloudResourceId,
            DataSensitivity = SecurityAssetDataSensitivity.Phi,
            RegulatoryClass = SecurityAssetRegulatoryClass.Hipaa,
            DeploymentEnvironment = SecurityAssetDeploymentEnvironment.Production,
            BusinessCriticality = SecurityAssetBusinessCriticality.CrownJewel,
            IsPatientImpact = true,
            Rationale = "Patient data store",
            ExpirationUtc = expirationUtc,
            Status = SecurityAssetAssertionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [1, 2, 3],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static SecurityAssetAssertionRecord CreateExpiredAssertion(Guid assertionId, DateTime expirationUtc) =>
        CreateActiveAssertion(assertionId, expirationUtc);

    private static OperationalSecurityFindingRecord CreateFinding(Guid findingId, DateTime utcNow) =>
        new()
        {
            FindingId = findingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "Defender",
            SourceFindingId = findingId.ToString("N"),
            CloudResourceId = CloudResourceId,
            Title = "Sensitive storage exposure",
            Severity = "High",
            FirstObservedUtc = utcNow,
            LastObservedUtc = utcNow,
            Status = OperationalSecurityFindingStatus.Open,
            PayloadHashSha256 = [1, 2, 3],
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private sealed class InMemorySecurityAssetAssertionRepository : ISecurityAssetAssertionRepository
    {
        public List<SecurityAssetAssertionRecord> Records { get; } = [];

        public Task InsertAsync(SecurityAssetAssertionRecord record, CancellationToken cancellationToken = default)
        {
            Records.Add(record);
            return Task.CompletedTask;
        }

        public Task<SecurityAssetAssertionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid assertionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.FirstOrDefault(record =>
                record.TenantId == tenantId && record.AssertionId == assertionId));

        public Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityAssetAssertionRecord>>(
                Records.Where(record => record.TenantId == tenantId).ToList());

        public Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdAsync(
            Guid tenantId,
            Guid cloudResourceId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.FirstOrDefault(record =>
                record.TenantId == tenantId
                && record.CloudResourceId == cloudResourceId
                && record.Status == SecurityAssetAssertionStatus.Active
                && record.ExpirationUtc > asOfUtc));

        public Task<IReadOnlyList<Guid>> ListActiveAssertionIdsAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>(Records
                .Where(record =>
                    record.TenantId == tenantId
                    && record.Status == SecurityAssetAssertionStatus.Active
                    && record.ExpirationUtc > asOfUtc)
                .Select(record => record.AssertionId)
                .ToList());

        public Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default)
        {
            List<SecurityAssetAssertionRecord> expired = [];

            for (int index = 0; index < Records.Count; index++)
            {
                SecurityAssetAssertionRecord record = Records[index];

                if (record.TenantId != tenantId
                    || record.Status != SecurityAssetAssertionStatus.Active
                    || record.ExpirationUtc >= asOfUtc)
                {
                    continue;
                }

                SecurityAssetAssertionRecord updated = CloneAssertion(record);
                updated = new SecurityAssetAssertionRecord
                {
                    AssertionId = updated.AssertionId,
                    TenantId = updated.TenantId,
                    WorkspaceId = updated.WorkspaceId,
                    ProjectId = updated.ProjectId,
                    CloudResourceId = updated.CloudResourceId,
                    DataSensitivity = updated.DataSensitivity,
                    RegulatoryClass = updated.RegulatoryClass,
                    DeploymentEnvironment = updated.DeploymentEnvironment,
                    BusinessCriticality = updated.BusinessCriticality,
                    IsRevenueImpact = updated.IsRevenueImpact,
                    IsPatientImpact = updated.IsPatientImpact,
                    Rationale = updated.Rationale,
                    EvidenceReference = updated.EvidenceReference,
                    ExpirationUtc = updated.ExpirationUtc,
                    Status = SecurityAssetAssertionStatus.Expired,
                    RequestedByActorKey = updated.RequestedByActorKey,
                    ApprovedByActorKey = updated.ApprovedByActorKey,
                    PayloadHashSha256 = updated.PayloadHashSha256,
                    ExpiryProcessedUtc = updated.ExpiryProcessedUtc,
                    CreatedUtc = updated.CreatedUtc,
                    UpdatedUtc = asOfUtc,
                    RevokedUtc = updated.RevokedUtc,
                    RevokedByActorKey = updated.RevokedByActorKey,
                };

                Records[index] = updated;
                expired.Add(updated);
            }

            return Task.FromResult<IReadOnlyList<SecurityAssetAssertionRecord>>(expired);
        }

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid assertionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default)
        {
            for (int index = 0; index < Records.Count; index++)
            {
                SecurityAssetAssertionRecord record = Records[index];

                if (record.TenantId == tenantId && record.AssertionId == assertionId)
                {
                    SecurityAssetAssertionRecord updated = CloneAssertion(record);
                    Records[index] = new SecurityAssetAssertionRecord
                    {
                        AssertionId = updated.AssertionId,
                        TenantId = updated.TenantId,
                        WorkspaceId = updated.WorkspaceId,
                        ProjectId = updated.ProjectId,
                        CloudResourceId = updated.CloudResourceId,
                        DataSensitivity = updated.DataSensitivity,
                        RegulatoryClass = updated.RegulatoryClass,
                        DeploymentEnvironment = updated.DeploymentEnvironment,
                        BusinessCriticality = updated.BusinessCriticality,
                        IsRevenueImpact = updated.IsRevenueImpact,
                        IsPatientImpact = updated.IsPatientImpact,
                        Rationale = updated.Rationale,
                        EvidenceReference = updated.EvidenceReference,
                        ExpirationUtc = updated.ExpirationUtc,
                        Status = updated.Status,
                        RequestedByActorKey = updated.RequestedByActorKey,
                        ApprovedByActorKey = updated.ApprovedByActorKey,
                        PayloadHashSha256 = updated.PayloadHashSha256,
                        ExpiryProcessedUtc = processedUtc,
                        CreatedUtc = updated.CreatedUtc,
                        UpdatedUtc = processedUtc,
                        RevokedUtc = updated.RevokedUtc,
                        RevokedByActorKey = updated.RevokedByActorKey,
                    };
                    break;
                }
            }

            return Task.CompletedTask;
        }

        public Task RevokeAsync(
            Guid tenantId,
            Guid assertionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateRenewalAsync(
            SecurityAssetAssertionRecord record,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        private static SecurityAssetAssertionRecord CloneAssertion(SecurityAssetAssertionRecord source) =>
            new()
            {
                AssertionId = source.AssertionId,
                TenantId = source.TenantId,
                WorkspaceId = source.WorkspaceId,
                ProjectId = source.ProjectId,
                CloudResourceId = source.CloudResourceId,
                DataSensitivity = source.DataSensitivity,
                RegulatoryClass = source.RegulatoryClass,
                DeploymentEnvironment = source.DeploymentEnvironment,
                BusinessCriticality = source.BusinessCriticality,
                IsRevenueImpact = source.IsRevenueImpact,
                IsPatientImpact = source.IsPatientImpact,
                Rationale = source.Rationale,
                EvidenceReference = source.EvidenceReference,
                ExpirationUtc = source.ExpirationUtc,
                Status = source.Status,
                RequestedByActorKey = source.RequestedByActorKey,
                ApprovedByActorKey = source.ApprovedByActorKey,
                PayloadHashSha256 = source.PayloadHashSha256,
                ExpiryProcessedUtc = source.ExpiryProcessedUtc,
                CreatedUtc = source.CreatedUtc,
                UpdatedUtc = source.UpdatedUtc,
                RevokedUtc = source.RevokedUtc,
                RevokedByActorKey = source.RevokedByActorKey,
            };
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

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            List<OperationalSecurityFindingRecord> items = Findings
                .Where(finding => finding.TenantId == tenantId && finding.CloudResourceId == cloudResourceId)
                .ToList();

            return Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord>, int)>((items, items.Count));
        }

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

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
                        observation.TenantId == tenantId && observation.FindingId == findingId)
                    .ToList());

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
            if (observation is not null)
            {
                Observations.Add(observation);
            }

            return Task.CompletedTask;
        }
    }
}
