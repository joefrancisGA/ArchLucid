using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSetAssignmentEnabledScopeTests
{
    [Fact]
    public async Task SetAssignmentEnabled_returns_not_found_when_assignment_is_out_of_scope()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TrySetAssignmentEnabledAsync(assignmentId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        PolicyPacksController sut = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        SetPolicyPackAssignmentEnabledRequest request = new() { IsEnabled = false };

        IActionResult result = await sut.SetAssignmentEnabled(assignmentId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
