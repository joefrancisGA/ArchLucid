using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceEnvironmentCatalogControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    [Fact]
    public async Task Get_returns_not_found_when_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            Mock.Of<IAuditService>(),
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Get(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        catalogService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Get_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            Mock.Of<IAuditService>(),
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Get(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        catalogService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Replace_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            Mock.Of<IAuditService>(),
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Replace(
            ValidReplaceRequest(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        catalogService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Replace_returns_bad_request_when_catalog_is_invalid_and_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new(MockBehavior.Strict);
        Mock<IAuditService> auditService = new(MockBehavior.Strict);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantMissingRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Replace(
            new ReplaceGovernanceEnvironmentCatalogRequest(),
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        catalogService.VerifyNoOtherCalls();
        auditService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Get_returns_effective_catalog()
    {
        GovernanceEnvironmentCatalog catalog = GovernanceEnvironmentCatalogDefaults.Create();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        catalogService
            .Setup(service => service.GetCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(catalog);

        Mock<IAuditService> auditService = new();

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantExistsRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Get(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GovernanceEnvironmentCatalog body = ok.Value.Should().BeOfType<GovernanceEnvironmentCatalog>().Subject;

        body.Environments.Should().HaveCount(3);
        body.Transitions.Should().HaveCount(2);
    }

    [Fact]
    public async Task Replace_returns_bad_request_when_catalog_is_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        catalogService
            .Setup(service => service.ReplaceCatalogAsync(It.IsAny<ReplaceGovernanceEnvironmentCatalogRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("At least one environment definition is required."));

        Mock<IAuditService> auditService = new();

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantExistsRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Replace(
            new ReplaceGovernanceEnvironmentCatalogRequest(),
            CancellationToken.None);

        action.Should().BeAssignableTo<ObjectResult>();
        ((ObjectResult)action).StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        auditService.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Replace_returns_not_found_when_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new(MockBehavior.Strict);
        Mock<IAuditService> auditService = new(MockBehavior.Strict);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantMissingRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.Replace(
            ValidReplaceRequest(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        catalogService.VerifyNoOtherCalls();
        auditService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Replace_persists_catalog_and_audits()
    {
        GovernanceEnvironmentCatalog saved = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition
                {
                    Slug = "draft",
                    DisplayName = "Draft",
                    SortOrder = 0,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = "approved",
                    DisplayName = "Approved",
                    SortOrder = 1,
                    IsActive = true,
                },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
            ],
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        catalogService
            .Setup(service => service.ReplaceCatalogAsync(It.IsAny<ReplaceGovernanceEnvironmentCatalogRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        catalogService
            .Setup(service => service.GetCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IAuditService> auditService = new();

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantExistsRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        ReplaceGovernanceEnvironmentCatalogRequest request = new()
        {
            Environments = saved.Environments,
            Transitions = saved.Transitions,
        };

        IActionResult action = await controller.Replace(request, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GovernanceEnvironmentCatalog body = ok.Value.Should().BeOfType<GovernanceEnvironmentCatalog>().Subject;

        body.Environments.Should().HaveCount(2);
        auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent => auditEvent.EventType == AuditEventTypes.GovernanceEnvironmentCatalogReplaced),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Replace_skips_duplicate_audit_when_identical_operator_retry()
    {
        GovernanceEnvironmentCatalog saved = new()
        {
            IsAdministratorConfigured = true,
            Environments =
            [
                new GovernanceEnvironmentDefinition
                {
                    Slug = "draft",
                    DisplayName = "Draft",
                    SortOrder = 0,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = "approved",
                    DisplayName = "Approved",
                    SortOrder = 1,
                    IsActive = true,
                },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
            ],
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        GovernanceEnvironmentCatalog defaults = GovernanceEnvironmentCatalogDefaults.Create();
        catalogService
            .SetupSequence(service => service.GetCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(defaults)
            .ReturnsAsync(saved)
            .ReturnsAsync(saved)
            .ReturnsAsync(saved);
        catalogService
            .Setup(service => service.ReplaceCatalogAsync(It.IsAny<ReplaceGovernanceEnvironmentCatalogRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantExistsRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        ReplaceGovernanceEnvironmentCatalogRequest request = ValidReplaceRequest();

        await controller.Replace(request, CancellationToken.None);
        await controller.Replace(request, CancellationToken.None);

        auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent => auditEvent.EventType == AuditEventTypes.GovernanceEnvironmentCatalogReplaced),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Replace_skips_duplicate_audit_when_display_name_differs_only_by_casing()
    {
        GovernanceEnvironmentCatalog saved = new()
        {
            IsAdministratorConfigured = true,
            Environments =
            [
                new GovernanceEnvironmentDefinition
                {
                    Slug = "draft",
                    DisplayName = "Draft",
                    SortOrder = 0,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = "approved",
                    DisplayName = "Approved",
                    SortOrder = 1,
                    IsActive = true,
                },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
            ],
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        catalogService
            .Setup(service => service.GetCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);
        catalogService
            .Setup(service => service.ReplaceCatalogAsync(It.IsAny<ReplaceGovernanceEnvironmentCatalogRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceEnvironmentCatalogController controller = new(
            scopeProvider.Object,
            catalogService.Object,
            auditService.Object,
            TenantExistsRepository())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        ReplaceGovernanceEnvironmentCatalogRequest exactMatch = ValidReplaceRequest();
        ReplaceGovernanceEnvironmentCatalogRequest casingVariant = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition
                {
                    Slug = "draft",
                    DisplayName = "draft",
                    SortOrder = 0,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = "approved",
                    DisplayName = "approved",
                    SortOrder = 1,
                    IsActive = true,
                },
            ],
            Transitions = exactMatch.Transitions,
        };

        await controller.Replace(exactMatch, CancellationToken.None);
        await controller.Replace(casingVariant, CancellationToken.None);

        auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent => auditEvent.EventType == AuditEventTypes.GovernanceEnvironmentCatalogReplaced),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ReplaceGovernanceEnvironmentCatalogRequest ValidReplaceRequest() => new()
    {
        Environments =
        [
            new GovernanceEnvironmentDefinition
            {
                Slug = "draft",
                DisplayName = "Draft",
                SortOrder = 0,
                IsActive = true,
            },
            new GovernanceEnvironmentDefinition
            {
                Slug = "approved",
                DisplayName = "Approved",
                SortOrder = 1,
                IsActive = true,
            },
        ],
        Transitions =
        [
            new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
        ],
    };

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));
}
