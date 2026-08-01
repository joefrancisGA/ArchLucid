using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspaceBaselineArtifactsControllerTests
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

        TenantWorkspaceBaselineArtifactsController controller = new(
            tenants.Object,
            Mock.Of<IAzureExtractorPackageRepository>(),
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetAsync_returns_baseline_presence_and_script_version()
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

        Mock<IAzureExtractorPackageRepository> packages = new();
        packages
            .Setup(r => r.GetWorkspaceBaselineArtifactsAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WorkspaceBaselineExtractorArtifacts(true, "2.4.1"));

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantWorkspaceBaselineArtifactsController controller = new(
            tenants.Object,
            packages.Object,
            scopeProvider.Object);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantWorkspaceBaselineArtifactsResponse body =
            ok.Value.Should().BeOfType<TenantWorkspaceBaselineArtifactsResponse>().Subject;

        body.HasBaselineArtifacts.Should().BeTrue();
        body.ExtractorScriptVersion.Should().Be("2.4.1");
    }
}
