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

    private static PolicyPacksController CreateController()
    {
        PolicyPacksController controller = new(
            Mock.Of<IPolicyPackWorkflowFacade>(),
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
