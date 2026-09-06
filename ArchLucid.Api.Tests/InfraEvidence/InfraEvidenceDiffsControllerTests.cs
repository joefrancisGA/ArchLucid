using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InfraEvidenceDiffsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ListChangesForDiff_passes_cloudResourceId_filter_to_query_service()
    {
        Guid diffId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid cloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IInfraEvidenceDriftWorkbenchQueryService> queryService = new();
        queryService
            .Setup(service => service.ListChangesForDiffAsync(
                Scope,
                diffId,
                1,
                50,
                cloudResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResponse<AzureInventoryChangeRecord>
            {
                Items = [],
                TotalCount = 0,
                Page = 1,
                PageSize = 50,
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        InfraEvidenceDiffsController controller = new(queryService.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.ListChangesForDiff(
            diffId,
            cloudResourceId,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        queryService.Verify(
            service => service.ListChangesForDiffAsync(
                Scope,
                diffId,
                1,
                50,
                cloudResourceId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
