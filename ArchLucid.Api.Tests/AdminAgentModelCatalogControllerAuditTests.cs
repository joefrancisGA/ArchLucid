using System.Security.Claims;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminAgentModelCatalogControllerAuditTests
{
    [Fact]
    public async Task Upsert_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

        AgentModelCatalogRow row = new()
        {
            AliasId = "gpt-test",
            ProviderConnectionKind = "azure-openai",
            CapabilityTags = ["structured-output"],
            ApprovedTaskTypes = ["Primary"],
            DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
            LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
        };

        Mock<IAgentModelCatalogRepository> catalogRepository = new();
        catalogRepository
            .Setup(r => r.TryGetAsync(row.AliasId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentModelCatalogRow?)null);
        catalogRepository
            .Setup(r => r.UpsertAsync(row, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        AdminAgentModelCatalogController controller = new(
            catalogRepository.Object,
            Mock.Of<IAgentModelCatalogEvaluationRecorder>(),
            Mock.Of<IAgentModelCatalogFaithfulnessHarnessImporter>(),
            Mock.Of<IAgentModelCatalogCacheInvalidator>(),
            actorContext.Object,
            auditService.Object,
            scopeProvider.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, "Operator Display")],
                        "test")),
            },
        };

        await controller.Upsert(row.AliasId, row, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
    }
}
