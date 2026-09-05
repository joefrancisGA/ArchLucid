using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RiskExceptionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static void SetupNoActiveWaivers(Mock<IRiskExceptionRepository> repository)
    {
        repository
            .Setup(r => r.ListActiveForTenantAsync(
                Scope.TenantId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
    }

    private static void SetupActiveWaivers(
        Mock<IRiskExceptionRepository> repository,
        params RiskExceptionRecord[] activeWaivers)
    {
        repository
            .Setup(r => r.ListActiveForTenantAsync(
                Scope.TenantId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeWaivers);
    }

    private static Mock<IFindingInspectReadRepository> CreateInspectMock(
        string requestedFindingId,
        string canonicalFindingId)
    {
        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                requestedFindingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = canonicalFindingId });

        return inspect;
    }

    [Fact]
    public async Task CreateAsync_rejects_when_finding_latest_disposition_is_remediated()
    {
        const string findingId = "finding-remediated";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    FindingId = findingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Mock<IRiskExceptionRepository> repository = new(MockBehavior.Strict);

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt waiver on remediated finding",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateAsync(request, Scope, "reviewer@test", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Remediated*");
    }

    [Fact]
    public async Task CreateAsync_throws_conflict_when_active_waiver_exists_for_finding()
    {
        const string findingId = "finding-1";
        Guid existingExceptionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupActiveWaivers(
            repository,
            new RiskExceptionRecord
            {
                RiskExceptionId = existingExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "existing waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt second waiver",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateAsync(request, Scope, "reviewer@test", CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*active waiver*");

        repository.Verify(
            r => r.CreateAsync(It.IsAny<RiskExceptionRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateAsync_marks_expired_before_duplicate_active_guard()
    {
        const string findingId = "finding-1";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupNoActiveWaivers(repository);
        repository
            .Setup(r => r.CreateAsync(It.IsAny<RiskExceptionRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner@contoso.com",
            Rationale = "replacement waiver after stale expiry row",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        await sut.CreateAsync(request, Scope, "reviewer@test", CancellationToken.None);

        repository.Verify(
            r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            r => r.CreateAsync(It.IsAny<RiskExceptionRecord>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RenewAsync_throws_conflict_when_another_active_waiver_exists_for_same_finding()
    {
        const string findingId = "finding-1";
        Guid expiredExceptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid activeExceptionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "expired waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupActiveWaivers(
            repository,
            new RiskExceptionRecord
            {
                RiskExceptionId = activeExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "replacement active waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.RenewAsync(
            Scope.TenantId,
            expiredExceptionId,
            request,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*active waiver*");

        repository.Verify(
            r => r.RenewAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewAsync_marks_expired_before_sibling_active_guard()
    {
        const string findingId = "finding-1";
        Guid expiredExceptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "expired waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupNoActiveWaivers(repository);
        repository
            .Setup(r => r.RenewAsync(
                Scope.TenantId,
                expiredExceptionId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repository
            .SetupSequence(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "expired waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            })
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "renewed waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        await sut.RenewAsync(
            Scope.TenantId,
            expiredExceptionId,
            request,
            "reviewer@test",
            CancellationToken.None);

        repository.Verify(
            r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            r => r.RenewAsync(
                Scope.TenantId,
                expiredExceptionId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_throws_conflict_when_active_waiver_finding_id_differs_only_by_casing()
    {
        const string canonicalFindingId = "finding-1";
        const string legacyStoredFindingId = "FINDING-1";
        Guid existingExceptionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, canonicalFindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupActiveWaivers(
            repository,
            new RiskExceptionRecord
            {
                RiskExceptionId = existingExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = legacyStoredFindingId,
                OwnerUserId = "owner",
                Rationale = "legacy casing waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        Mock<IFindingInspectReadRepository> inspect = CreateInspectMock(canonicalFindingId, canonicalFindingId);

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            inspect.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = canonicalFindingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt duplicate under canonical casing",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateAsync(request, Scope, "reviewer@test", CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*active waiver*");

        repository.Verify(
            r => r.CreateAsync(It.IsAny<RiskExceptionRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewAsync_rejects_when_remediated_trail_finding_id_differs_only_by_casing_from_stored_waiver()
    {
        const string canonicalFindingId = "finding-1";
        const string legacyStoredFindingId = "FINDING-1";
        Guid expiredExceptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, canonicalFindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    FindingId = canonicalFindingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = legacyStoredFindingId,
                OwnerUserId = "owner",
                Rationale = "legacy casing waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupNoActiveWaivers(repository);

        Mock<IFindingInspectReadRepository> inspect = CreateInspectMock(legacyStoredFindingId, canonicalFindingId);

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            inspect.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.RenewAsync(
            Scope.TenantId,
            expiredExceptionId,
            request,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Remediated*");

        repository.Verify(
            r => r.RenewAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewAsync_trims_padded_rationale_and_evidence_ref_before_persist()
    {
        const string findingId = "finding-1";
        Guid expiredExceptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        const string trimmedRationale = "renewed-ok";
        const string trimmedEvidenceRef = "artifact://evidence/1";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "expired waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        SetupNoActiveWaivers(repository);
        repository
            .Setup(r => r.RenewAsync(
                Scope.TenantId,
                expiredExceptionId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                trimmedRationale,
                trimmedEvidenceRef,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repository
            .SetupSequence(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "expired waiver",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            })
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = expiredExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = trimmedRationale,
                EvidenceRef = trimmedEvidenceRef,
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            Rationale = $"  {trimmedRationale}  ",
            EvidenceRef = $"  {trimmedEvidenceRef}  ",
        };

        await sut.RenewAsync(
            Scope.TenantId,
            expiredExceptionId,
            request,
            "reviewer@test",
            CancellationToken.None);

        repository.Verify(
            r => r.RenewAsync(
                Scope.TenantId,
                expiredExceptionId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                trimmedRationale,
                trimmedEvidenceRef,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RenewAsync_throws_conflict_when_risk_exception_status_is_revoked()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Revoked,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });

        RiskExceptionService sut = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.RenewAsync(
            Scope.TenantId,
            exceptionId,
            request,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*Revoked*");

        repository.Verify(
            r => r.RenewAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RevokeAsync_throws_conflict_when_risk_exception_status_is_revoked()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Revoked,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });

        RiskExceptionService sut = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        Func<Task> act = () => sut.RevokeAsync(
            Scope.TenantId,
            exceptionId,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*Revoked*");

        repository.Verify(
            r => r.RevokeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RevokeAsync_throws_conflict_when_risk_exception_status_is_expired()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Expired,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RiskExceptionService sut = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        Func<Task> act = () => sut.RevokeAsync(
            Scope.TenantId,
            exceptionId,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*active*");

        repository.Verify(
            r => r.RevokeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RevokeAsync_marks_expired_before_revoke_when_waiver_is_past_expiry()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        DateTimeOffset pastExpiry = DateTimeOffset.UtcNow.AddDays(-1);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .SetupSequence(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Active,
                ExpiresAtUtc = pastExpiry,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                CreatedByUserId = "creator",
            })
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Expired,
                ExpiresAtUtc = pastExpiry,
                CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                CreatedByUserId = "creator",
            });
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RiskExceptionService sut = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        Func<Task> act = () => sut.RevokeAsync(
            Scope.TenantId,
            exceptionId,
            "reviewer@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*active*");

        repository.Verify(
            r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            r => r.RevokeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
