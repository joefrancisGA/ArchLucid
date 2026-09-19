using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Contracts.InfraEvidence;
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
public sealed class InfraEvidenceOperatorInferredConnectionsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid SnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task Confirm_returns_not_found_when_service_reports_missing_row()
    {
        Mock<IOperatorInferredConnectionService> service = new();
        service
            .Setup(s => s.ConfirmAsync(
                Scope,
                SnapshotId,
                It.IsAny<OperatorInferredConnectionConfirmRequest>(),
                "actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OperatorInferredConnectionMutationResult
            {
                Succeeded = false,
                ErrorMessage = "Inferred connection was not found.",
            });

        InfraEvidenceOperatorInferredConnectionsController controller = CreateController(service.Object);
        OperatorInferredConnectionConfirmApiRequest request = new() { ConnectionId = Guid.NewGuid() };

        IActionResult result = await controller.Confirm(SnapshotId, request, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task List_maps_questionnaire_and_upload_sources()
    {
        Mock<IOperatorInferredConnectionService> service = new();
        service
            .Setup(s => s.ListBySnapshotAsync(Scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new OperatorInferredConnectionRecord
                {
                    ConnectionId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    SnapshotId = SnapshotId,
                    Status = OperatorInferredConnectionStatus.Proposed,
                    Source = OperatorInferredConnectionSource.Upload,
                    ToHost = "api.example.com",
                    ProposalPayloadHashSha256 = [],
                    CreatedUtc = DateTime.UtcNow,
                    UpdatedUtc = DateTime.UtcNow,
                },
            ]);

        InfraEvidenceOperatorInferredConnectionsController controller = CreateController(service.Object);
        IActionResult result = await controller.List(SnapshotId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<OperatorInferredConnectionResponse> payload =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<OperatorInferredConnectionResponse>>().Subject;

        payload.Should().ContainSingle(item => item.Source == "upload");
    }

    private static InfraEvidenceOperatorInferredConnectionsController CreateController(
        IOperatorInferredConnectionService service)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.GetActorId()).Returns("actor");

        return new InfraEvidenceOperatorInferredConnectionsController(
            service,
            scopeProvider.Object,
            actorContext.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
