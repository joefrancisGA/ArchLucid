using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InfraEvidenceSnapshotsControllerDeleteTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task DeleteSnapshot_returns_204_when_deleted()
    {
        Guid snapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IAzureInventorySnapshotDeleteService> deleteService = new();
        deleteService
            .Setup(service => service.TryDeleteAsync(Scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.Deleted,
            });

        Mock<IAuditService> auditService = new();
        InfraEvidenceSnapshotsController controller = CreateController(deleteService.Object, auditService.Object);

        IActionResult result = await controller.DeleteSnapshot(snapshotId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        auditService.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshot_returns_409_when_bound_to_architecture()
    {
        Guid snapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IAzureInventorySnapshotDeleteService> deleteService = new();
        deleteService
            .Setup(service => service.TryDeleteAsync(Scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.BlockedBoundToArchitecture,
                BlockingReferenceCount = 1,
            });

        InfraEvidenceSnapshotsController controller = CreateController(deleteService.Object, Mock.Of<IAuditService>());

        IActionResult result = await controller.DeleteSnapshot(snapshotId, CancellationToken.None);

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    private static InfraEvidenceSnapshotsController CreateController(
        IAzureInventorySnapshotDeleteService deleteService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return new InfraEvidenceSnapshotsController(
            Mock.Of<IInfraEvidenceDriftWorkbenchQueryService>(),
            Mock.Of<IAdvisoryTerraformRepresentationService>(),
            Mock.Of<IInfraEvidenceSnapshotMermaidService>(),
            deleteService,
            auditService,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
