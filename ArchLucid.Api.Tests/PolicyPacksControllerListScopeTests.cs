using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tenant preflight for <c>GET /v1/policy-packs</c> (ghost tenant must not return HTTP 200).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerListScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task List_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        PolicyPacksController sut = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.List(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task List_returns_packs_when_tenant_exists()
    {
        PolicyPack pack = new()
        {
            PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "baseline",
        };

        Mock<IPolicyPackWorkflowFacade> workflow = new();
        workflow
            .Setup(f => f.ListVisiblePacksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyPack> { pack });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        PolicyPacksController sut = new(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.List(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IReadOnlyList<PolicyPack>>();
    }
}
