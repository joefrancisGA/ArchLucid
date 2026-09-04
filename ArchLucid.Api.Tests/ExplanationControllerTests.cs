using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExplanationControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task ExplainRun_returns_not_found_when_run_has_no_manifest()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ExplanationController controller = CreateController(query: query.Object);

        IActionResult action = await controller.ExplainRun(runId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetFindingExplainability_returns_not_found_when_finding_missing()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding { FindingId = "other-finding", Title = "Other" }
            ]
        };

        RunDetailDto detail = new() { FindingsSnapshot = snapshot };

        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        ExplanationController controller = CreateController(query: query.Object);

        IActionResult action = await controller.GetFindingExplainability(
            runId,
            "missing-finding",
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task HolisticCritic_returns_not_found_when_service_reports_missing_run()
    {
        Guid runId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IHolisticCriticService> critic = new();
        critic
            .Setup(c => c.GenerateAsync(Scope, runId, It.IsAny<HolisticCriticRequest?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Run was not found in scope."));

        ExplanationController controller = CreateController(holisticCritic: critic.Object);

        IActionResult action = await controller.HolisticCritic(runId, null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static ExplanationController CreateController(
        IAuthorityQueryService? query = null,
        IHolisticCriticService? holisticCritic = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new ExplanationController(
            query ?? Mock.Of<IAuthorityQueryService>(),
            Mock.Of<ICompareRunsApplicationFacade>(),
            Mock.Of<IExplanationService>(),
            Mock.Of<IRunExplanationSummaryService>(),
            Mock.Of<IFindingExplainabilityComposer>(),
            Mock.Of<IFindingLlmAuditService>(),
            Mock.Of<IProvenanceSnapshotRepository>(),
            scopeProvider.Object,
            holisticCritic ?? Mock.Of<IHolisticCriticService>(),
            NullLogger<ExplanationController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
