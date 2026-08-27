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
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

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

    [Fact]
    public async Task DeletePack_returns_bad_request_when_policy_pack_id_is_empty_guid()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateController(workflow);

        IActionResult result = await sut.DeletePack(Guid.Empty, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DuplicatePack_returns_bad_request_when_policy_pack_id_is_empty_guid()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateController(workflow);

        IActionResult result = await sut.DuplicatePack(Guid.Empty, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ArchiveAssignment_returns_bad_request_when_assignment_id_is_empty_guid()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateController(workflow);

        IActionResult result = await sut.ArchiveAssignment(Guid.Empty, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    private static PolicyPacksController CreateController(Mock<IPolicyPackWorkflowFacade> workflow)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        PolicyPacksController controller = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            tenants.Object);

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
