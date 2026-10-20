using System.Security.Claims;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceEnvironmentCatalogControllerAuditTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Replace_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

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

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

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
            actorContext.Object,
            auditService.Object,
            tenants.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                            [new Claim(ClaimTypes.Name, "Operator Display")],
                            "test")),
                },
            },
        };

        ReplaceGovernanceEnvironmentCatalogRequest request = new()
        {
            Environments = saved.Environments,
            Transitions = saved.Transitions,
        };

        IActionResult action = await controller.Replace(request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
    }
}
