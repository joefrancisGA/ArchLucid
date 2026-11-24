using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureDiagramIngestNullSourceTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Ingest_NullSource_ReturnsBadRequestWithoutInvokingService(bool includeValidSource)
    {
        var service = new Mock<IStructuredDiagramIngestService>(MockBehavior.Strict);
        var controller = new ArchitectureDiagramIngestController(
            service.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        IReadOnlyList<DiagramSourceReference> sources = includeValidSource
            ? [new DiagramSourceReference { Name = "diagram", Format = "mermaid", Content = "graph TD" }, null!]
            : [null!];
        IActionResult result = await controller.Ingest(Guid.NewGuid(), new StructuredDiagramIngestRequest
        {
            Sources = sources,
        }, CancellationToken.None);
        Assert.Equal(400, Assert.IsAssignableFrom<ObjectResult>(result).StatusCode);
        service.VerifyNoOtherCalls();
    }
}
