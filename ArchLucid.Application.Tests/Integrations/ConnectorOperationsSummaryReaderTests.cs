using ArchLucid.Application.Integrations;
using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConnectorOperationsSummaryReaderTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetSummaryAsync_digest_advisory_surface_reports_total_rows_when_disabled_subscriptions_exist()
    {
        Mock<IDigestSubscriptionRepository> digestSubscriptions = new();
        digestSubscriptions
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new DigestSubscription
                {
                    SubscriptionId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    ChannelType = DigestDeliveryChannelType.Email,
                    IsEnabled = false,
                },
            ]);

        ConnectorOperationsSummaryReader reader = CreateReader(digestSubscriptions.Object);

        ConnectorOperationsSummary summary = await reader.GetSummaryAsync(Scope, CancellationToken.None);

        ConnectorSurfaceSummary digestSurface = summary.Surfaces
            .Single(surface => surface.ConnectorKey == "digests_advisory");

        digestSurface.Summary.Should().Contain("0 enabled digest subscription(s) of 1 row(s)");
        digestSurface.Summary.Should().NotContain("0 digest subscription row(s)");
    }

    private static ConnectorOperationsSummaryReader CreateReader(IDigestSubscriptionRepository digestSubscriptionRepository)
    {
        Mock<IAdvisoryScanScheduleRepository> schedules = new();
        schedules
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdvisoryScanSchedule>());

        Mock<IAlertRoutingSubscriptionRepository> alertRoutes = new();
        alertRoutes
            .Setup(r => r.ListEnabledByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantTeamsIncomingWebhookConnectionRepository> teams = new();
        teams
            .Setup(r => r.GetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TeamsIncomingWebhookConnectionResponse?)null);

        Mock<ITenantItsmOutboundSettingsRepository> itsmSettings = new();
        itsmSettings
            .Setup(r => r.TryGetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        Mock<ITenantAzureBoardsOutboundSettingsRepository> azureBoardsSettings = new();
        azureBoardsSettings
            .Setup(r => r.TryGetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantAzureBoardsOutboundSettings?)null);

        Mock<ITenantItsmConnectorConnectionRepository> itsmConnections = new();
        itsmConnections
            .Setup(r => r.GetAsync(Scope.TenantId, TenantItsmConnectorProvider.AzureBoards, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmConnectorConnectionRecord?)null);

        return new ConnectorOperationsSummaryReader(
            Options.Create(new IntegrationEventsOptions()),
            Options.Create(new IntegrationsItsmOutboundOptions()),
            Options.Create(new ConfluencePublishingOptions { Enabled = false }),
            teams.Object,
            itsmSettings.Object,
            azureBoardsSettings.Object,
            itsmConnections.Object,
            digestSubscriptionRepository,
            schedules.Object,
            alertRoutes.Object);
    }
}
