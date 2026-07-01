using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantCostSettingsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly ValueReportComputationOptions Defaults = new()
    {
        FullyLoadedArchitectHourlyUsd = 150m,
        DefaultAverageIncidentCostUsd = 25_000m
    };

    [Fact]
    public async Task GetAsync_returns_platform_defaults_when_no_row()
    {
        Mock<ITenantCostSettingsRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCostSettingsRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCostSettingsController controller = CreateController(
            repository.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantCostSettingsGetResponse body = ok.Value.Should().BeOfType<TenantCostSettingsGetResponse>().Subject;

        body.IsTenantConfigured.Should().BeFalse();
        body.ArchitectHourlyRateUsd.Should().Be(150m);
        body.AverageIncidentCostUsd.Should().Be(25_000m);
        body.EaDiscountMultiplier.Should().Be(1.0m);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_architect_rate_invalid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCostSettingsController controller = CreateController(
            Mock.Of<ITenantCostSettingsRepository>(),
            scopeProvider.Object,
            Mock.Of<IAuditService>());

        TenantCostSettingsPutRequest body = new()
        {
            ArchitectHourlyRateUsd = 0m,
            AverageIncidentCostUsd = 25_000m
        };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PutAsync_persists_row_and_returns_configured_response()
    {
        Mock<ITenantCostSettingsRepository> repository = new();
        repository
            .Setup(r => r.UpsertAsync(It.IsAny<TenantCostSettingsRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();

        TenantCostSettingsController controller = CreateController(
            repository.Object,
            scopeProvider.Object,
            audit.Object);

        TenantCostSettingsPutRequest body = new()
        {
            ArchitectHourlyRateUsd = 200m,
            AverageIncidentCostUsd = 30_000m,
            EaDiscountPercentage = 10m
        };

        IActionResult action = await controller.PutAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantCostSettingsGetResponse saved = ok.Value.Should().BeOfType<TenantCostSettingsGetResponse>().Subject;

        saved.IsTenantConfigured.Should().BeTrue();
        saved.ArchitectHourlyRateUsd.Should().Be(200m);
        saved.EaDiscountMultiplier.Should().Be(0.9m);
        saved.EaDiscountPercentage.Should().Be(10m);

        repository.Verify(
            r => r.UpsertAsync(
                It.Is<TenantCostSettingsRecord>(row =>
                    row.TenantId == Scope.TenantId
                    && row.ArchitectHourlyRateUsd == 200m),
                It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TenantCostSettingsUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TenantCostSettingsController CreateController(
        ITenantCostSettingsRepository repository,
        IScopeContextProvider scopeProvider,
        IAuditService auditService)
    {
        Mock<IOptions<ValueReportComputationOptions>> options = new();
        options.Setup(o => o.Value).Returns(Defaults);

        return new TenantCostSettingsController(repository, scopeProvider, auditService, options.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
