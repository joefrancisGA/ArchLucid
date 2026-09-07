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

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.PublishVersionAsync(
                foreignPackId,
                It.IsAny<PolicyPackPublishBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackVersion>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                Message = $"Policy pack '{foreignPackId}' was not found in the current scope.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

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

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.AssignAsync(
                foreignPackId,
                It.IsAny<PolicyPackAssignBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                PolicyPackId = foreignPackId,
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

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

        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.AssignAsync(
                packId,
                It.IsAny<PolicyPackAssignBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Assignment = assignment,
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        AssignPolicyPackRequest request = new()
        {
            Version = "1.0.0",
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(packId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DemoteCatalogEntry_returns_not_found_when_catalog_entry_source_pack_is_out_of_scope()
    {
        Guid foreignCatalogEntryId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.DemoteCatalogEntryAsync(
                It.Is<PolicyPackDemoteCatalogBody>(body => body.PolicyPackCatalogEntryId == foreignCatalogEntryId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                Message = $"Policy pack catalog entry '{foreignCatalogEntryId}' was not found.",
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.DemoteCatalogEntry(
            new DemotePolicyPackCatalogEntryRequest { PolicyPackCatalogEntryId = foreignCatalogEntryId },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
