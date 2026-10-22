using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSimulationMissingRunTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Simulate_returns_not_found_for_missing_run_before_sealed_manifest_check()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SimulateAsync(
                It.IsAny<PolicyPackContentDocument>(),
                runId.ToString("D"),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
            });

        PolicyPacksController sut = CreateController(httpFacade);

        IActionResult result = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = runId.ToString("D"),
                Content = new(),
            },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        httpFacade.VerifyAll();
    }

    [Fact]
    public async Task SimulateBulk_preserves_missing_run_summary_before_sealed_manifest_check()
    {
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string runId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff").ToString("D");
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SimulateBulkAsync(
                packId,
                It.Is<IReadOnlyList<string>>(ids => ids.Count == 1 && ids[0] == runId),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.Success(
                    new PolicyPackSimulateBulkSummary
                    {
                        PolicyPackId = packId,
                        PolicyPackVersion = "1.0.0",
                        RequestedRunCount = 1,
                        EvaluatedRunCount = 0,
                        NotFoundRunCount = 1,
                        WouldBlockCommitCount = 0,
                        Results =
                        [
                            new PolicyPackSimulateBulkRunOutcome
                            {
                                RunId = runId,
                                Found = false,
                                WouldBlockCommit = false,
                            },
                        ],
                    }));

        PolicyPacksController sut = CreateController(httpFacade);

        IActionResult result = await sut.SimulateBulk(
            packId,
            new PolicyPackSimulateBulkRequest { RunIds = [runId] },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<PolicyPackSimulateBulkSummaryResponse>()
            .Which.NotFoundRunCount.Should().Be(1);
        httpFacade.VerifyAll();
    }

    private static PolicyPacksController CreateController(Mock<IPolicyPackHttpFacade> httpFacade)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return new PolicyPacksController(
            httpFacade.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
