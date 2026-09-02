using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Governance.PolicyPacks;

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

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SetAssignmentEnabledAsync(assignmentId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        SetPolicyPackAssignmentEnabledRequest request = new() { IsEnabled = false };

        IActionResult result = await sut.SetAssignmentEnabled(assignmentId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
