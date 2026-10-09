using System.Data;
using System.Security.Claims;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminApiKeySettingsControllerAuditTests
{
    [Fact]
    public async Task RotateAsync_persisted_audit_keeps_api_key_name_when_name_identifier_is_absent()
    {
        AuditEvent? captured = await RotateAndCaptureAuditAsync(
            (controller, cancellationToken) => controller.RotateAsync(
                new AdminApiKeyRotateRequest { Slot = "Admin" },
                cancellationToken));

        captured.Should().NotBeNull();
        captured!.ActorUserId.Should().Be("ApiKeyAdmin");
        captured.ActorUserName.Should().Be("ApiKeyAdmin");
    }

    [Fact]
    public async Task RotateKeyIdAsync_persisted_audit_keeps_api_key_name_when_name_identifier_is_absent()
    {
        AuditEvent? captured = await RotateAndCaptureAuditAsync(
            (controller, cancellationToken) => controller.RotateKeyIdAsync("ReadOnly", cancellationToken));

        captured.Should().NotBeNull();
        captured!.ActorUserId.Should().Be("ApiKeyAdmin");
        captured.ActorUserName.Should().Be("ApiKeyAdmin");
    }

    private static async Task<AuditEvent?> RotateAndCaptureAuditAsync(
        Func<AdminApiKeySettingsController, CancellationToken, Task<Microsoft.AspNetCore.Mvc.IActionResult>> rotate)
    {
        AuditEvent? captured = null;
        Mock<IAuditRepository> repository = new();
        repository
            .Setup(repo => repo.AppendAsync(
                It.IsAny<AuditEvent>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .Callback<AuditEvent, CancellationToken, IDbConnection?, IDbTransaction?>((auditEvent, _, _, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = tenantId,
            ProjectId = tenantId,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        DefaultHttpContext httpContext = new()
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [new Claim(ClaimTypes.Name, "ApiKeyAdmin")],
                    authenticationType: "ApiKey")),
        };

        Mock<IHttpContextAccessor> httpAccessor = new();
        httpAccessor.Setup(accessor => accessor.HttpContext).Returns(httpContext);

        Mock<IAdminApiKeySettingsService> settings = new();
        settings
            .Setup(service => service.Rotate(It.IsAny<AdminApiKeyRotateRequest>()))
            .Returns(
                new AdminApiKeyRotateResponse
                {
                    Slot = "Admin",
                    DeploymentAction = "Replace",
                    ConfigPath = "Authentication:ApiKey:AdminKey",
                    PlaintextKey = "generated-key",
                });

        AdminApiKeySettingsController controller = new(
            settings.Object,
            scopeProvider.Object,
            new AuditService(repository.Object, httpAccessor.Object, scopeProvider.Object))
        {
            ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext { HttpContext = httpContext },
        };

        await rotate(controller, CancellationToken.None);

        return captured;
    }
}
