using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantIntegrationsOperationsControllerTests
{
    [Fact]
    public async Task GetAsync_maps_summary_to_response()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000")
        };

        ConnectorOperationsSummary summary = new()
        {
            Surfaces =
            [
                new ConnectorSurfaceSummary
                {
                    ConnectorKey = "jira",
                    DisplayName = "Jira",
                    IsConfigured = true,
                    SmokeReadiness = "Ready",
                    Summary = "Connected",
                    ConfigurationHref = "/settings/integrations/jira"
                }
            ],
            IntegrationEventBus = new IntegrationEventBusSummary
            {
                PublisherConfigured = true,
                TransactionalOutboxEnabled = true,
                ConsumerConfigured = false,
                QueueOrTopicName = "integration-events",
                FullyQualifiedNamespace = "example.servicebus.windows.net",
                UsesLegacyConnectionString = false,
                SmokeReadiness = "PublisherReady"
            }
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IConnectorOperationsSummaryReader> reader = new();
        reader
            .Setup(r => r.GetSummaryAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        TenantIntegrationsOperationsController controller =
            new(scopeProvider.Object, reader.Object);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantIntegrationsOperationsResponse response =
            ok.Value.Should().BeOfType<TenantIntegrationsOperationsResponse>().Subject;

        response.Connectors.Should().ContainSingle();
        response.Connectors[0].ConnectorKey.Should().Be("jira");
        response.IntegrationEventBus.PublisherConfigured.Should().BeTrue();
        response.IntegrationEventBus.QueueOrTopicName.Should().Be("integration-events");
    }
}
