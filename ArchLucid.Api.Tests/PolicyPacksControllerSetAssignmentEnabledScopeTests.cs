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

    [Fact]
    public async Task SetAssignmentEnabled_returns_conflict_when_disabling_organization_required_assignment()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SetAssignmentEnabledAsync(assignmentId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.Conflict,
                Message = "Organization-required policy pack assignments cannot be disabled. Clear organization-required first.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        SetPolicyPackAssignmentEnabledRequest request = new() { IsEnabled = false };

        IActionResult result = await sut.SetAssignmentEnabled(assignmentId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task SetAssignmentEnabled_returns_conflict_when_enabling_assignment_on_inactive_platform_pack()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SetAssignmentEnabledAsync(assignmentId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.Conflict,
                Message = "Policy pack assignments cannot be enabled while the platform pack is inactive in the global catalog.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        SetPolicyPackAssignmentEnabledRequest request = new() { IsEnabled = true };

        IActionResult result = await sut.SetAssignmentEnabled(assignmentId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task SetAssignmentOrganizationRequired_returns_conflict_when_setting_org_required_on_inactive_platform_pack()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SetAssignmentOrganizationRequiredAsync(assignmentId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.Conflict,
                Message = "Organization-required policy pack assignments cannot be set while the platform pack is inactive in the global catalog.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        SetPolicyPackAssignmentOrganizationRequiredRequest request = new() { IsOrganizationRequired = true };

        IActionResult result = await sut.SetAssignmentOrganizationRequired(assignmentId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task ArchiveAssignment_returns_not_found_when_assignment_is_out_of_scope()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.ArchiveAssignmentAsync(assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.ArchiveAssignment(assignmentId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ArchiveAssignment_returns_conflict_when_assignment_is_organization_required()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.ArchiveAssignmentAsync(assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.Conflict,
                Message = "Organization-required policy pack assignments cannot be archived. Clear organization-required first.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.ArchiveAssignment(assignmentId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
