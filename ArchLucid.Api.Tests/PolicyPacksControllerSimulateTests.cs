using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

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
        PolicyPacksController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = null!,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_is_empty_guid()
    {
        PolicyPacksController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Empty.ToString("D"),
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_content_missing()
    {
        PolicyPacksController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = "run-1",
                Content = null!,
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_proposed_policy_pack_id_is_empty_guid()
    {
        PolicyPacksController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
                ProposedPolicyPackId = Guid.Empty,
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_block_commit_minimum_severity_out_of_range()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(workflow);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
                BlockCommitMinimumSeverity = 9,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_exceeds_max_length()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateController(workflow);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = new string('r', 65),
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    private static PolicyPacksController CreateController(Mock<IPolicyPackWorkflowFacade>? workflow = null)
    {
        PolicyPacksController controller = new(
            workflow?.Object ?? Mock.Of<IPolicyPackWorkflowFacade>(),
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
