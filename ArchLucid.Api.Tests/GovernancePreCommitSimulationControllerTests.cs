using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernancePreCommitSimulationControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetChecklist_returns_not_found_for_out_of_scope_run_id()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(runId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        checklist.VerifyNoOtherCalls();
    }

    private static GovernancePreCommitSimulationController CreateController(
        IRunRepository? runRepository = null,
        IPreFinalizeChecklistService? checklistService = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new GovernancePreCommitSimulationController(
            Mock.Of<IPreCommitGovernanceGate>(),
            checklistService ?? Mock.Of<IPreFinalizeChecklistService>(),
            Mock.Of<IAuditService>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            scope.Object);
    }
}
