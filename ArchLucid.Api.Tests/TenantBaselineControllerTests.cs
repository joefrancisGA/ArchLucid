using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantBaselineControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetAsync_projects_baseline_fields_from_tenant_row()
    {
        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-01T10:00:00Z");
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            BaselineManualPrepHoursPerReview = 6m,
            BaselinePeoplePerReview = 4,
            BaselineManualPrepCapturedUtc = captured,
            BaselineReviewCycleHours = 40m
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantBaselineGetResponse body = ok.Value.Should().BeOfType<TenantBaselineGetResponse>().Subject;

        body.ManualPrepHoursPerReview.Should().Be(6m);
        body.PeoplePerReview.Should().Be(4);
        body.CapturedUtc.Should().Be(captured);
        body.BaselineReviewCycleHours.Should().Be(40m);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_manual_prep_hours_invalid()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantBaselinePutRequest body = new() { ManualPrepHoursPerReview = 0m };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_manual_prep_hours_invalid_and_tenant_missing()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantBaselinePutRequest body = new() { ManualPrepHoursPerReview = 0m };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_people_per_review_set_without_manual_prep_hours()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            BaselineManualPrepHoursPerReview = null,
            BaselinePeoplePerReview = null,
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantBaselinePutRequest body = new() { PeoplePerReview = 4 };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        tenants.Verify(
            r => r.UpdateBaselineAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<int?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_review_cycle_source_note_exceeds_persisted_max_length()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            BaselineReviewCycleHours = 40m,
            BaselineReviewCycleSource = "baseline_settings: old note",
            BaselineReviewCycleCapturedUtc = DateTimeOffset.Parse("2026-05-01T10:00:00Z")
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        string overLengthNote = new('x', BaselineReviewCycleSourceMarkers.MaxOperatorSettingsNoteLength + 1);
        TenantBaselinePutRequest body = new() { BaselineReviewCycleSourceNote = overLengthNote };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_review_cycle_source_note_without_captured_hours()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantBaselinePutRequest body = new() { BaselineReviewCycleSourceNote = "Operator note" };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_persists_review_cycle_source_note_when_hours_already_captured()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            BaselineReviewCycleHours = 40m,
            BaselineReviewCycleSource = "operator-settings: old note",
            BaselineReviewCycleCapturedUtc = DateTimeOffset.Parse("2026-05-01T10:00:00Z")
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);
        tenants
            .Setup(r => r.PersistTrialSignupBaselineReviewCycleAsync(
                Scope.TenantId,
                40m,
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object);

        TenantBaselinePutRequest body = new() { BaselineReviewCycleSourceNote = "Updated operator note" };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        tenants.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                Scope.TenantId,
                40m,
                It.Is<string?>(s => s != null && s.Contains("Updated operator note", StringComparison.Ordinal)),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialBaselineReviewCycleUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PutAsync_returns_existing_projection_when_no_fields_touched()
    {
        TenantRecord tenant = new()
        {
            Id = Scope.TenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            BaselineManualPrepHoursPerReview = 5m
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantBaselineController controller = CreateController(
            tenants.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantBaselinePutRequest body = new();

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantBaselineGetResponse projected = ok.Value.Should().BeOfType<TenantBaselineGetResponse>().Subject;

        projected.ManualPrepHoursPerReview.Should().Be(5m);

        tenants.Verify(
            r => r.UpdateBaselineAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<int?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static TenantBaselineController CreateController(
        ITenantRepository tenantRepository,
        IScopeContextProvider scopeProvider,
        IAuditService auditService) =>
        new(tenantRepository, scopeProvider, auditService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
}
