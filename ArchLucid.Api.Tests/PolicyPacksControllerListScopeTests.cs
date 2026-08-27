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
///     Tenant preflight for policy pack reads and mutations (ghost tenant must not return HTTP 200).
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

    [Fact]
    public async Task GetPageBundle_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetPageBundle(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetEffective_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetEffective(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Create_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Create(
            new CreatePolicyPackRequest
            {
                Name = "baseline",
                Description = "desc",
                PackType = "TenantCustom",
                InitialContentJson = "{}",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Publish_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Publish(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new PublishPolicyPackVersionRequest
            {
                Version = "2.0.0",
                ContentJson = """{"complianceRuleIds":[]}""",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListVersions_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ListVersions(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetVersion_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetVersion(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            "1.0.0",
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ExplainPack_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            workflow: new Mock<IPolicyPackWorkflowFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ExplainPack(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static PolicyPacksController CreateSut(
        Mock<IPolicyPackWorkflowFacade> workflow,
        bool tenantExists)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                tenantExists
                    ? new TenantRecord { Id = Scope.TenantId, Name = "contoso" }
                    : null);

        return new PolicyPacksController(
            workflow.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
