using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantExecDigestPreferencesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetExecDigestPreferences_returns_unconfigured_defaults_when_no_row()
    {
        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExecDigestPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetExecDigestPreferences(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ExecDigestPreferencesResponse body = ok.Value.Should().BeOfType<ExecDigestPreferencesResponse>().Subject;

        body.TenantId.Should().Be(Scope.TenantId);
        body.IsConfigured.Should().BeFalse();
    }

    [Fact]
    public async Task GetExecDigestPreferences_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>(),
            tenantRepository.Object);

        IActionResult action = await controller.GetExecDigestPreferences(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repository.Verify(
            r => r.GetByTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_body_null()
    {
        TenantExecDigestPreferencesController controller = CreateController(
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        IActionResult action = await controller.PostExecDigestPreferences(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_day_of_week_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { DayOfWeek = 7 };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_iana_time_zone_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { IanaTimeZoneId = "Not/AZone" };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_not_found_when_upsert_misses_tenant()
    {
        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                It.IsAny<bool>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExecDigestPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = true };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PostExecDigestPreferences_persists_and_audits_on_success()
    {
        ExecDigestPreferencesResponse saved = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z")
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "America/New_York",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(saved);

        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ExecDigestPreferencesUpdated
                    && e.TenantId == Scope.TenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TenantExecDigestPreferencesController CreateController(
        IScopeContextProvider scopeProvider,
        ITenantExecDigestPreferencesRepository preferencesRepository,
        IAuditService auditService,
        ITenantRepository? tenantRepository = null)
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        return new TenantExecDigestPreferencesController(
            scopeProvider,
            preferencesRepository,
            auditService,
            tenantRepository ?? tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
