using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for policy pack duplicate and delete mutations (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerDuplicateDeleteScopeTests
{
    [Fact]
    public async Task DuplicatePack_returns_not_found_when_pack_belongs_to_another_workspace()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TryDuplicatePackAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPack?)null);

        PolicyPacksController sut = CreateController(workflow);

        IActionResult result = await sut.DuplicatePack(foreignPackId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DeletePack_returns_not_found_when_pack_belongs_to_another_workspace()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TrySoftDeletePackAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        PolicyPacksController sut = CreateController(workflow);

        IActionResult result = await sut.DeletePack(foreignPackId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
