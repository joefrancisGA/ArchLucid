using ArchLucid.Api.Controllers.Integrations;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Application.Common;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>Unit coverage for <c>/v1/integrations/itsm/correlations</c> lifecycle audit wiring (TB-388).</summary>
[Trait("Category", "Unit")]
public sealed class ItsmCorrelationControllerTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [SkippableFact]
    public async Task RegisterUpdateRemove_emits_register_updated_removed_audit_sequence()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        Mock<IAuditService> audit = new();

        ItsmFindingCorrelationRecord prior = CreateRecord("finding-1", "Jira", "PROJ-1", "sys-1");
        ItsmFindingCorrelationRecord current = CreateRecord("finding-1", "Jira", "PROJ-2", "sys-2");

        correlations
            .Setup(repo => repo.TryResolveLatestCommittedFindingRecordIdAsync(
                TenantId,
                "finding-1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        correlations
            .Setup(repo => repo.RegisterAsync(
                TenantId,
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "finding-1",
                "Jira",
                "PROJ-1",
                "sys-1",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        correlations
            .Setup(repo => repo.UpdateExternalTrackingAsync(
                TenantId,
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "finding-1",
                "Jira",
                "PROJ-2",
                "sys-2",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ItsmFindingCorrelationUpdateResult
            {
                Status = ItsmFindingCorrelationUpdateStatus.Updated,
                Prior = prior,
                Current = current
            });

        correlations
            .Setup(repo => repo.RemoveByFindingAndProviderAsync(
                TenantId,
                "finding-1",
                "Jira",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(current);

        ItsmCorrelationController sut = CreateController(correlations.Object, audit);

        RegisterItsmCorrelationRequest registerBody = new()
        {
            FindingId = "finding-1",
            Provider = "Jira",
            ExternalKey = "PROJ-1",
            ExternalSysId = "sys-1"
        };

        IActionResult registerResult = await sut.RegisterCorrelation(registerBody, CancellationToken.None);
        registerResult.Should().BeOfType<NoContentResult>();

        RegisterItsmCorrelationRequest updateBody = new()
        {
            FindingId = "finding-1",
            Provider = "Jira",
            ExternalKey = "PROJ-2",
            ExternalSysId = "sys-2"
        };

        IActionResult updateResult = await sut.UpdateCorrelation(updateBody, CancellationToken.None);
        updateResult.Should().BeOfType<NoContentResult>();

        IActionResult removeResult = await sut.RemoveCorrelation("finding-1", "Jira", CancellationToken.None);
        removeResult.Should().BeOfType<NoContentResult>();

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.IntegrationItsmFindingCorrelationRegistered
                    && evt.ActorUserId == "jwt:user-1"
                    && evt.DataJson.Contains("PROJ-1", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.IntegrationItsmFindingCorrelationUpdated
                    && evt.DataJson.Contains("priorExternalKey", StringComparison.Ordinal)
                    && evt.DataJson.Contains("PROJ-1", StringComparison.Ordinal)
                    && evt.DataJson.Contains("PROJ-2", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.IntegrationItsmFindingCorrelationRemoved
                    && evt.DataJson.Contains("priorExternalKey", StringComparison.Ordinal)
                    && evt.DataJson.Contains("PROJ-2", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task UpdateCorrelation_when_unchanged_does_not_emit_audit()
    {
        ItsmFindingCorrelationRecord existing = CreateRecord("finding-1", "Jira", "PROJ-1", null);

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(repo => repo.UpdateExternalTrackingAsync(
                TenantId,
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "finding-1",
                "Jira",
                "PROJ-1",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ItsmFindingCorrelationUpdateResult
            {
                Status = ItsmFindingCorrelationUpdateStatus.Unchanged,
                Prior = existing,
                Current = existing
            });

        Mock<IAuditService> audit = new();
        ItsmCorrelationController sut = CreateController(correlations.Object, audit);

        RegisterItsmCorrelationRequest body = new()
        {
            FindingId = "finding-1",
            Provider = "Jira",
            ExternalKey = "PROJ-1"
        };

        IActionResult result = await sut.UpdateCorrelation(body, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task RemoveCorrelation_when_absent_is_idempotent_and_does_not_emit_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(repo => repo.RemoveByFindingAndProviderAsync(
                TenantId,
                "finding-1",
                "Jira",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);

        Mock<IAuditService> audit = new();
        ItsmCorrelationController sut = CreateController(correlations.Object, audit);

        IActionResult result = await sut.RemoveCorrelation("finding-1", "Jira", CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ItsmFindingCorrelationRecord CreateRecord(
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId)
    {
        return new ItsmFindingCorrelationRecord
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FindingId = findingId,
            Provider = provider,
            ExternalKey = externalKey,
            ExternalSysId = externalSysId,
            CreatedUtc = DateTime.UtcNow
        };
    }

    private static ItsmCorrelationController CreateController(
        IItsmFindingCorrelationRepository correlations,
        Mock<IAuditService> audit)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid()
            });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.GetActorId()).Returns("jwt:user-1");
        actorContext.Setup(context => context.GetActor()).Returns("operator@example.com");

        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> outboundOptions = new();
        outboundOptions.Setup(monitor => monitor.CurrentValue).Returns(new IntegrationsItsmOutboundOptions());

        ItsmFindingCorrelationQueryService queryService = new(
            correlations,
            new ItsmExternalTicketUrlBuilder(outboundOptions.Object));

        return new ItsmCorrelationController(
            scopeProvider.Object,
            actorContext.Object,
            correlations,
            queryService,
            audit.Object);
    }
}
