using System.Text.Json;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Serialization;
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
public sealed class TenantSponsorDigestPreferencesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public void SponsorDigestPreferencesUpsertRequest_deserialization_rejects_missing_email_enabled()
    {
        Action act = () => JsonSerializer.Deserialize<SponsorDigestPreferencesUpsertRequest>(
            """{"recipientEmails":["sponsor@contoso.test"]}""",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_applies_default_timezone_when_iana_time_zone_omitted()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "UTC",
                1,
                8,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["sponsor@contoso.test"],
                IanaTimeZoneId = "UTC",
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        SponsorDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["sponsor@contoso.test"],
        };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task GetSponsorDigestPreferences_returns_unconfigured_defaults_when_no_row()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SponsorDigestPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetSponsorDigestPreferences(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        SponsorDigestPreferencesResponse body = ok.Value.Should().BeOfType<SponsorDigestPreferencesResponse>().Subject;

        body.TenantId.Should().Be(Scope.TenantId);
        body.IsConfigured.Should().BeFalse();
    }

    [Fact]
    public async Task GetSponsorDigestPreferences_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> repository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>(),
            tenantRepository.Object);

        IActionResult action = await controller.GetSponsorDigestPreferences(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repository.Verify(
            r => r.GetByTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_bad_request_when_body_null()
    {
        TenantSponsorDigestPreferencesController controller = CreateController(
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantSponsorDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        IActionResult action = await controller.PostSponsorDigestPreferences(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_bad_request_when_day_of_week_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantSponsorDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        SponsorDigestPreferencesUpsertRequest body = new() { EmailEnabled = false, DayOfWeek = 7 };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_bad_request_when_iana_time_zone_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantSponsorDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        SponsorDigestPreferencesUpsertRequest body = new() { EmailEnabled = false, IanaTimeZoneId = "Not/AZone" };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_not_found_when_upsert_misses_tenant()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                It.IsAny<bool>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((SponsorDigestPreferencesResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        SponsorDigestPreferencesUpsertRequest body = new() { EmailEnabled = false };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_bad_request_when_email_enabled_without_recipients()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantSponsorDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        SponsorDigestPreferencesUpsertRequest body = new() { EmailEnabled = true, RecipientEmails = [] };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_returns_bad_request_when_recipient_emails_exceed_max_serialized_length()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantSponsorDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        string longLocalPart = new('a', 1000);
        SponsorDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = [$"{longLocalPart}@contoso.test", $"{longLocalPart}@fabrikam.test"],
        };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostSponsorDigestPreferences_persists_and_audits_on_success()
    {
        SponsorDigestPreferencesResponse saved = new()
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

        Mock<ITenantSponsorDigestPreferencesRepository> repository = new();
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

        TenantSponsorDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        SponsorDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9
        };

        IActionResult action = await controller.PostSponsorDigestPreferences(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(saved);

        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.SponsorDigestPreferencesUpdated
                    && e.TenantId == Scope.TenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TenantSponsorDigestPreferencesController CreateController(
        IScopeContextProvider scopeProvider,
        ITenantSponsorDigestPreferencesRepository preferencesRepository,
        IAuditService auditService,
        ITenantRepository? tenantRepository = null)
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        return new TenantSponsorDigestPreferencesController(
            scopeProvider,
            preferencesRepository,
            auditService,
            tenantRepository ?? tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
