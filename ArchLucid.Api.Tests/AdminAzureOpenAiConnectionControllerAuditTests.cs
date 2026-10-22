using System.Security.Claims;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.AiProviders;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminAzureOpenAiConnectionControllerAuditTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task Upsert_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

        TenantAzureOpenAiConnectionUpsertRequest request = new()
        {
            Endpoint = "https://contoso.openai.azure.com/",
            ApiKeyKeyVaultSecretName = "tenant-contoso-azure-openai-api-key",
            DeploymentsJson = """{"default":"gpt-4o"}""",
        };

        TenantAzureOpenAiConnectionResponse saved = new()
        {
            TenantId = TenantId,
            IsConfigured = true,
            ProviderConnectionId = "conn-1",
            Endpoint = "https://contoso.openai.azure.com/",
            IsEnabled = true,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<ITenantAzureOpenAiConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.UpsertAsync(TenantId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        AdminAzureOpenAiConnectionController controller = CreateController(
            scopeProvider.Object,
            connectionService.Object,
            actorContext.Object,
            auditService.Object);
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

        IActionResult result = await controller.Upsert(request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
        captured.EventType.Should().Be(AuditEventTypes.TenantAzureOpenAiConnectionUpserted);
    }

    [Fact]
    public async Task Delete_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<ITenantAzureOpenAiConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.DeleteAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        AdminAzureOpenAiConnectionController controller = CreateController(
            scopeProvider.Object,
            connectionService.Object,
            actorContext.Object,
            auditService.Object);
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

        IActionResult result = await controller.Delete(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
        captured.EventType.Should().Be(AuditEventTypes.TenantAzureOpenAiConnectionRemoved);
    }

    private static AdminAzureOpenAiConnectionController CreateController(
        IScopeContextProvider scopeProvider,
        ITenantAzureOpenAiConnectionService connectionService,
        IActorContext actorContext,
        IAuditService auditService) =>
        new(
            scopeProvider,
            connectionService,
            Mock.Of<ITenantAzureOpenAiConnectionProbeService>(),
            actorContext,
            auditService);
}
