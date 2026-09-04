using ArchLucid.Application.Analysis;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceMutationCorrectionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task RecordAsync_appends_correction_audit_without_mutating_approval_row()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string approvalRequestId = "apr-correction-1";
        List<AuditEvent> auditEvents = [];

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
                Status = GovernanceApprovalStatus.Approved,
            });

        Mock<IRunRepository> runs = CreateScopedRunRepository(runId);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => auditEvents.Add(evt))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            runs.Object,
            auditService.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = approvalRequestId,
                RunId = runId,
                Rationale = "Approved the wrong review package.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.MutationKind.Should().Be(GovernanceMutationCorrectionKinds.QuickApprove);
        result.SubjectId.Should().Be(approvalRequestId);
        result.Rationale.Should().Be("Approved the wrong review package.");
        auditEvents.Should().ContainSingle();
        auditEvents[0].EventType.Should().Be(AuditEventTypes.GovernanceMutationCorrectionRecorded);
        auditEvents[0].DataJson.Should().Contain(approvalRequestId);
        approvals.Verify(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()), Times.Once);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordAsync_requires_non_empty_rationale()
    {
        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowApprove,
                SubjectId = "apr-1",
                RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                Rationale = "   ",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    private static GovernanceMutationCorrectionService CreateSut(
        IGovernanceApprovalRequestRepository approvalRepo,
        IRunRepository runRepository,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new GovernanceMutationCorrectionService(
            approvalRepo,
            new Mock<IGovernancePromotionRecordRepository>().Object,
            new Mock<IGovernanceEnvironmentActivationRepository>().Object,
            scopeProvider.Object,
            runRepository,
            CreateAuthorityQueryService(runRepository).Object,
            CreateManifestHashService().Object,
            auditService,
            NullLogger<GovernanceMutationCorrectionService>.Instance);
    }

    private static Mock<IAuthorityQueryService> CreateAuthorityQueryService(IRunRepository runRepository)
    {
        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
            {
                ManifestDocument manifest = new()
                {
                    RunId = runId,
                    ManifestHash = "SEALED-HASH",
                };

                return new RunDetailDto
                {
                    Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                    GoldenManifest = manifest,
                };
            });

        return query;
    }

    private static Mock<IManifestHashService> CreateManifestHashService()
    {
        Mock<IManifestHashService> hashService = new();
        hashService
            .Setup(h => h.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("SEALED-HASH");

        return hashService;
    }

    private static Mock<IRunRepository> CreateScopedRunRepository(string runId)
    {
        Guid runGuid = Guid.Parse(runId);
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = runGuid });

        return runs;
    }
}
