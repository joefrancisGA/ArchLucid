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
public sealed class TenantExecDigestPreferencesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public void ExecDigestPreferencesUpsertRequest_deserialization_rejects_missing_email_enabled()
    {
        Action act = () => JsonSerializer.Deserialize<ExecDigestPreferencesUpsertRequest>(
            """{"recipientEmails":["exec@contoso.test"]}""",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public async Task PostExecDigestPreferences_applies_default_schedule_when_day_of_week_and_hour_omitted()
    {
        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "UTC",
                1,
                8,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["exec@contoso.test"],
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task PostExecDigestPreferences_applies_default_timezone_when_iana_time_zone_omitted()
    {
        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "UTC",
                1,
                8,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["exec@contoso.test"],
                IanaTimeZoneId = "UTC",
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

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

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false, DayOfWeek = 7 };

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

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false, IanaTimeZoneId = "Not/AZone" };

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

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PostExecDigestPreferences_preserves_schedule_and_timezone_when_disable_only_body_omits_schedule_fields()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                false,
                It.Is<IReadOnlyList<string>>(emails => emails.SequenceEqual(new[] { "exec@contoso.test" })),
                "America/New_York",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = false,
                RecipientEmails = ["exec@contoso.test"],
                IanaTimeZoneId = "America/New_York",
                DayOfWeek = 2,
                HourOfDay = 9,
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task PostExecDigestPreferences_preserves_schedule_and_timezone_when_enable_only_body_omits_schedule_fields()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = false,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.Is<IReadOnlyList<string>>(emails => emails.SequenceEqual(new[] { "exec@contoso.test" })),
                "America/New_York",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["exec@contoso.test"],
                IanaTimeZoneId = "America/New_York",
                DayOfWeek = 2,
                HourOfDay = 9,
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = true };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task PostExecDigestPreferences_preserves_recipients_when_disable_only_body_omits_recipient_emails()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "UTC",
            DayOfWeek = 1,
            HourOfDay = 8,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                false,
                It.Is<IReadOnlyList<string>>(emails => emails.SequenceEqual(new[] { "exec@contoso.test" })),
                "UTC",
                1,
                8,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = false,
                RecipientEmails = ["exec@contoso.test"],
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task PostExecDigestPreferences_preserves_recipients_when_disable_only_body_has_empty_recipient_emails_array()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "UTC",
            DayOfWeek = 1,
            HourOfDay = 8,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                false,
                It.Is<IReadOnlyList<string>>(emails => emails.SequenceEqual(new[] { "exec@contoso.test" })),
                "UTC",
                1,
                8,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = Scope.TenantId,
                IsConfigured = true,
                EmailEnabled = false,
                RecipientEmails = ["exec@contoso.test"],
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = false, RecipientEmails = [] };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        repository.VerifyAll();
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_recipient_emails_are_whitespace_only()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "UTC",
            DayOfWeek = 1,
            HourOfDay = 8,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .Setup(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = false,
            RecipientEmails = ["   ", "\t"],
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repository.Verify(
            r => r.UpsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<bool>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_email_enabled_without_recipients()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = true, RecipientEmails = [] };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_recipient_email_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new() { EmailEnabled = true, RecipientEmails = ["not-an-email"] };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_recipient_email_duplicated()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test", "Exec@contoso.test"]
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostExecDigestPreferences_returns_bad_request_when_recipient_emails_exceed_max_serialized_length()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>(),
            Mock.Of<IAuditService>());

        string longLocalPart = new('a', 1000);
        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = [$"{longLocalPart}@contoso.test", $"{longLocalPart}@fabrikam.test"],
        };

        IActionResult action = await controller.PostExecDigestPreferences(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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

    [Fact]
    public async Task PostExecDigestPreferences_skips_duplicate_audit_when_identical_operator_retry()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .SetupSequence(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExecDigestPreferencesResponse?)null)
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "America/New_York",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        await controller.PostExecDigestPreferences(body, CancellationToken.None);
        await controller.PostExecDigestPreferences(body, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ExecDigestPreferencesUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PostExecDigestPreferences_skips_duplicate_audit_when_iana_time_zone_differs_only_by_utc_alias()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "Etc/UTC",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "UTC",
            DayOfWeek = 2,
            HourOfDay = 9,
        };

        ExecDigestPreferencesResponse saved = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "UTC",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .SetupSequence(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing)
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "UTC",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        await controller.PostExecDigestPreferences(body, CancellationToken.None);
        await controller.PostExecDigestPreferences(body, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ExecDigestPreferencesUpdated),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PostExecDigestPreferences_skips_duplicate_audit_when_iana_time_zone_differs_only_by_casing()
    {
        ExecDigestPreferencesResponse existing = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "America/New_York",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        ExecDigestPreferencesUpsertRequest body = new()
        {
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "america/new_york",
            DayOfWeek = 2,
            HourOfDay = 9,
        };

        ExecDigestPreferencesResponse saved = new()
        {
            TenantId = Scope.TenantId,
            IsConfigured = true,
            EmailEnabled = true,
            RecipientEmails = ["exec@contoso.test"],
            IanaTimeZoneId = "america/new_york",
            DayOfWeek = 2,
            HourOfDay = 9,
            UpdatedUtc = DateTimeOffset.Parse("2026-06-01T08:00:00Z"),
        };

        Mock<ITenantExecDigestPreferencesRepository> repository = new();
        repository
            .SetupSequence(r => r.GetByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing)
            .ReturnsAsync(existing);
        repository
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                true,
                It.IsAny<IReadOnlyList<string>>(),
                "america/new_york",
                2,
                9,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantExecDigestPreferencesController controller = CreateController(
            scopeProvider.Object,
            repository.Object,
            audit.Object);

        await controller.PostExecDigestPreferences(body, CancellationToken.None);
        await controller.PostExecDigestPreferences(body, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ExecDigestPreferencesUpdated),
                It.IsAny<CancellationToken>()),
            Times.Never);
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
