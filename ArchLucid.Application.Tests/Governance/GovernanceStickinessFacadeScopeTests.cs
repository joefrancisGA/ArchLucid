using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceStickinessFacadeScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetRiskRegisterAsync_returns_empty_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(riskRegister: riskRegister.Object);

        ArchitectureRiskRegisterResponse response = await sut.GetRiskRegisterAsync(
            foreignProjectId,
            maxRows: 50,
            assignedToMe: false,
            CancellationToken.None);

        response.Entries.Should().BeEmpty();
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDispositionAsync_throws_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        GovernanceStickinessFacade sut = CreateSut(findingInspect: findings.Object);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "foreign-finding",
            RunId = Guid.NewGuid(),
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "accepted",
        };

        Func<Task> act = () => sut.RecordDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*not found in the current scope*");
    }

    [Fact]
    public async Task ListDispositionsAsync_returns_empty_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            dispositionService: dispositions.Object);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListDispositionsAsync("foreign-finding", CancellationToken.None);

        history.Should().BeEmpty();
        dispositions.VerifyNoOtherCalls();
    }

    private static GovernanceStickinessFacade CreateSut(
        IArchitectureRiskRegisterService? riskRegister = null,
        IFindingInspectReadRepository? findingInspect = null,
        IFindingDispositionService? dispositionService = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new GovernanceStickinessFacade(
            scope.Object,
            Mock.Of<IActorContext>(),
            dispositionService ?? new Mock<IFindingDispositionService>().Object,
            Mock.Of<IRiskExceptionService>(),
            riskRegister ?? new Mock<IArchitectureRiskRegisterService>().Object,
            Mock.Of<IArchitectureDecisionRegisterService>(),
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IRealizedValueAttestationService>(),
            Mock.Of<IAuditService>(),
            findingInspect ?? Mock.Of<IFindingInspectReadRepository>());
    }
}
