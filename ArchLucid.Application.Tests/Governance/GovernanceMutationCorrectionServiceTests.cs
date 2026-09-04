using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

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
            auditService,
            NullLogger<GovernanceMutationCorrectionService>.Instance);
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
