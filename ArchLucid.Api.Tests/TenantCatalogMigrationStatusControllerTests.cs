using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantCatalogMigrationStatusControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetCatalogMigrationStatusAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantMigrationStatusService> migrationService = new();
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCatalogMigrationStatusController controller = new(
            migrationService.Object,
            tenantRepository.Object,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await controller.GetCatalogMigrationStatusAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        migrationService.Verify(
            s => s.GetForTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetCatalogMigrationStatusAsync_returns_snapshot_when_tenant_exists()
    {
        TenantMigrationStatusSnapshot snapshot = new()
        {
            InMigration = true,
            Message = "Catalog migration in progress.",
            CorrelationId = "corr-1",
            Stage = "Verification",
            MigrationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            LastVerificationError = null,
        };

        Mock<ITenantMigrationStatusService> migrationService = new();
        migrationService
            .Setup(s => s.GetForTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCatalogMigrationStatusController controller = new(
            migrationService.Object,
            tenantRepository.Object,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await controller.GetCatalogMigrationStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantCatalogMigrationStatusResponse body = ok.Value.Should().BeOfType<TenantCatalogMigrationStatusResponse>().Subject;
        body.InMigration.Should().BeTrue();
        body.CorrelationId.Should().Be("corr-1");
    }
}
