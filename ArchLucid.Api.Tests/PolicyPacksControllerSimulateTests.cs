using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSimulateTests
{
    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = null!,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_content_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = "run-1",
                Content = null!,
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = overlongRunId,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksControllerTestSupport.SetupScopeNotFoundDefaults(httpFacade);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
                BlockCommitMinimumSeverity = 99,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }
}
