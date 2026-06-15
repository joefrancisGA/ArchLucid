using System.Text.Json;

using ArchLucid.Api.Controllers.Operator;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Operator;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Unit coverage for <c>/v1/operator/saved-views</c> HTTP wiring.</summary>
[Trait("Category", "Unit")]
public sealed class OperatorSavedViewsControllerTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [SkippableFact]
    public async Task ListSavedViews_ReturnsViewsForCurrentUser()
    {
        OperatorSavedViewResponse expected = new()
        {
            Id = Guid.NewGuid(),
            Surface = OperatorSavedViewSurfaces.Audit,
            Name = "Security review",
            Payload = new OperatorSavedViewPayload
            {
                Filters = JsonSerializer.SerializeToElement(new { eventType = "FinalizeRun" }),
                Sort = "occurredUtc:desc"
            }
        };

        Mock<IOperatorSavedViewRepository> repository = new();
        repository
            .Setup(repo => repo.ListAsync(TenantId, "jwt:user-1", OperatorSavedViewSurfaces.Audit, It.IsAny<CancellationToken>()))
            .ReturnsAsync([expected]);

        OperatorSavedViewsController sut = CreateController(repository.Object);

        IActionResult result = await sut.ListSavedViews(OperatorSavedViewSurfaces.Audit, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        OperatorSavedViewListResponse body = ok.Value.Should().BeOfType<OperatorSavedViewListResponse>().Subject;
        body.Views.Should().ContainSingle().Which.Should().BeSameAs(expected);
    }

    [SkippableFact]
    public async Task CreateSavedView_ReturnsCreated_and_emits_audit()
    {
        CreateOperatorSavedViewRequest request = new()
        {
            Surface = OperatorSavedViewSurfaces.Graph,
            Name = "Architecture neighborhood",
            Payload = new OperatorSavedViewPayload
            {
                Filters = JsonSerializer.SerializeToElement(new { mode = "node-neighborhood", depth = 2 }),
                Sort = null,
                ColumnVisibility = JsonSerializer.SerializeToElement(new { showNodeKindLegend = true })
            }
        };

        OperatorSavedViewResponse created = new()
        {
            Id = Guid.NewGuid(),
            Surface = OperatorSavedViewSurfaces.Graph,
            Name = request.Name,
            Payload = request.Payload
        };

        Mock<IOperatorSavedViewRepository> repository = new();
        repository
            .Setup(repo => repo.CreateAsync(
                TenantId,
                "jwt:user-1",
                OperatorSavedViewSurfaces.Graph,
                request.Name,
                It.IsAny<string>(),
                null,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        Mock<IAuditService> audit = new();
        OperatorSavedViewsController sut = CreateController(repository.Object, audit);

        IActionResult result = await sut.CreateSavedView(request, CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.OperatorSavedViewCreated
                    && evt.ActorUserId == "jwt:user-1"
                    && evt.TenantId == TenantId
                    && evt.DataJson.Contains(created.Id.ToString("D"), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task DeleteSavedView_ReturnsNoContentWhenDeleted_and_emits_audit()
    {
        Guid viewId = Guid.NewGuid();
        Mock<IOperatorSavedViewRepository> repository = new();
        repository
            .Setup(repo => repo.DeleteAsync(TenantId, "jwt:user-1", viewId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        OperatorSavedViewsController sut = CreateController(repository.Object, audit);

        IActionResult result = await sut.DeleteSavedView(viewId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.OperatorSavedViewDeleted
                    && evt.ActorUserId == "jwt:user-1"
                    && evt.DataJson.Contains(viewId.ToString("D"), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static OperatorSavedViewsController CreateController(
        IOperatorSavedViewRepository repository,
        Mock<IAuditService>? auditMock = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.GetActorId()).Returns("jwt:user-1");
        actorContext.Setup(context => context.GetActor()).Returns("operator@example.com");

        Mock<IAuditService> audit = auditMock ?? new Mock<IAuditService>();

        return new OperatorSavedViewsController(
            scopeProvider.Object,
            actorContext.Object,
            audit.Object,
            repository);
    }
}
