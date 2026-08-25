using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for policy pack publish and assign mutations (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerPublishAssignScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Publish_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TryPublishVersionAsync(
                foreignPackId,
                "2.0.0",
                """{"complianceRuleIds":[]}""",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null);

        PolicyPacksController sut = CreateController(workflow);

        PublishPolicyPackVersionRequest request = new()
        {
            Version = "2.0.0",
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        IActionResult result = await sut.Publish(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Assign_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(f => f.TryAssignAsync(
                foreignPackId,
                "1.0.0",
                "Project",
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.PackNotFound, null));

        PolicyPacksController sut = CreateController(workflow);

        AssignPolicyPackRequest request = new()
        {
            Version = "1.0.0",
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Assign_creates_assignment_when_pack_is_in_caller_scope()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = Guid.NewGuid(),
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
        };

        Mock<IPolicyPackWorkflowFacade> workflow = new();
        workflow
            .Setup(f => f.TryAssignAsync(
                packId,
                "1.0.0",
                "Project",
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.Assigned, assignment));

        PolicyPacksController sut = CreateController(workflow);

        AssignPolicyPackRequest request = new()
        {
            Version = "1.0.0",
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(packId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    private static PolicyPacksController CreateController(Mock<IPolicyPackWorkflowFacade> workflow)
    {
        PolicyPacksController controller = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
