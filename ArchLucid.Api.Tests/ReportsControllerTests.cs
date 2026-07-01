using ArchLucid.Api.Controllers.Reports;
using ArchLucid.Application.Reports;
using ArchLucid.Contracts.Reports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReportsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetResourceCoverageAsync_returns_empty_report_when_no_package()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAzureExtractorPackageRepository> packages = new();
        packages
            .Setup(r => r.TryGetLatestDownloadInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.AzureExtractorPackageDownloadRecord?)null);

        ResourceCoverageReportService service = new(scopeProvider.Object, packages.Object);
        ReportsController controller = new(service);

        ActionResult<ResourceCoverageReportResponse> action =
            await controller.GetResourceCoverageAsync(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ResourceCoverageReportResponse body =
            ok.Value.Should().BeOfType<ResourceCoverageReportResponse>().Subject;

        body.Rows.Should().BeEmpty();
    }
}
