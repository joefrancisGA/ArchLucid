using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for <c>POST /v1/policy-packs/{id}/simulate-bulk</c> (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSimulateBulkScopeTests
{
    [Fact]
    public async Task SimulateBulk_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TrySimulateBulkAsync(
                foreignPackId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackSimulateBulkSummary?)null);

        PolicyPacksController sut = CreateController(workflow);

        PolicyPackSimulateBulkRequest request = new() { RunIds = ["run-1"] };

        IActionResult result = await sut.SimulateBulk(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SimulateBulk_evaluates_runs_when_pack_is_in_caller_scope()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        PolicyPackSimulateBulkSummary summary = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            RequestedRunCount = 1,
            EvaluatedRunCount = 1,
            Results =
            [
                new PolicyPackSimulateBulkRunOutcome
                {
                    RunId = "run-1",
                    Found = true,
                    WouldBlockCommit = false,
                    Detail = new PolicyPackGovernanceDryRunResult
                    {
                        ResolvedRunId = "run-1",
                        GateResult = PreCommitGateResult.Allowed(),
                    },
                },
            ],
        };

        Mock<IPolicyPackWorkflowFacade> workflow = new();
        workflow
            .Setup(f => f.TrySimulateBulkAsync(
                packId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        PolicyPacksController sut = CreateController(workflow);

        PolicyPackSimulateBulkRequest request = new() { RunIds = ["run-1"] };

        IActionResult result = await sut.SimulateBulk(packId, request, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<PolicyPackSimulateBulkSummaryResponse>();
    }

    private static PolicyPacksController CreateController(Mock<IPolicyPackWorkflowFacade> workflow)
    {
        PolicyPacksController controller = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
