using ArchLucid.Api.Controllers.Notifications;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CustomerNotificationChannelPreferencesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetCustomerChannelPreferences_returns_unconfigured_defaults_when_no_row()
    {
        Mock<ITenantNotificationChannelPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantNotificationChannelPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        CustomerNotificationChannelPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetCustomerChannelPreferences(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantNotificationChannelPreferencesResponse body =
            ok.Value.Should().BeOfType<TenantNotificationChannelPreferencesResponse>().Subject;

        body.TenantId.Should().Be(Scope.TenantId);
        body.IsConfigured.Should().BeFalse();
        body.EmailCustomerNotificationsEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task PutCustomerChannelPreferences_returns_bad_request_when_body_null()
    {
        CustomerNotificationChannelPreferencesController controller = CreateController(
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantNotificationChannelPreferencesRepository>(),
            Mock.Of<IAuditService>());

        IActionResult action = await controller.PutCustomerChannelPreferences(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PutCustomerChannelPreferences_returns_not_found_when_upsert_misses_tenant()
    {
        Mock<ITenantNotificationChannelPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantNotificationChannelPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        CustomerNotificationChannelPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        TenantNotificationChannelPreferencesUpsertRequest body = new()
        {
            EmailCustomerNotificationsEnabled = false
        };

        IActionResult action = await controller.PutCustomerChannelPreferences(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PutCustomerChannelPreferences_persists_and_audits_on_success()
    {
        TenantNotificationChannelPreferencesResponse saved = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailCustomerNotificationsEnabled = false,
            TeamsCustomerNotificationsEnabled = true,
            OutboundWebhookCustomerNotificationsEnabled = true,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z")
        };

        Mock<ITenantNotificationChannelPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(Scope.TenantId, false, true, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();

        CustomerNotificationChannelPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        TenantNotificationChannelPreferencesUpsertRequest body = new()
        {
            EmailCustomerNotificationsEnabled = false,
            TeamsCustomerNotificationsEnabled = true,
            OutboundWebhookCustomerNotificationsEnabled = true
        };

        IActionResult action = await controller.PutCustomerChannelPreferences(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(saved);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.TenantNotificationChannelPreferencesUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static CustomerNotificationChannelPreferencesController CreateController(
        IScopeContextProvider scopeProvider,
        ITenantNotificationChannelPreferencesRepository preferencesRepository,
        IAuditService auditService) =>
        new(scopeProvider, preferencesRepository, auditService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
}
