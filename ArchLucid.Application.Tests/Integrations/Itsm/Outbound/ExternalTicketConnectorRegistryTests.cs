using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExternalTicketConnectorRegistryTests
{
    [Fact]
    public void GetRequired_returns_registered_connector_by_provider_id()
    {
        Mock<IExternalTicketConnector> jira = CreateConnector(ItsmOutboundIssueProvider.Jira, "Jira");
        Mock<IExternalTicketConnector> serviceNow = CreateConnector(ItsmOutboundIssueProvider.ServiceNow, "ServiceNow");
        ExternalTicketConnectorRegistry registry = new([jira.Object, serviceNow.Object]);

        registry.GetRequired(ItsmOutboundIssueProvider.Jira).ProviderLabel.Should().Be("Jira");
        registry.GetRequired(ItsmOutboundIssueProvider.ServiceNow).ProviderLabel.Should().Be("ServiceNow");
    }

    [Fact]
    public void GetRequired_throws_when_provider_not_registered()
    {
        ExternalTicketConnectorRegistry registry = new([]);

        Action act = () => registry.GetRequired(ItsmOutboundIssueProvider.Jira);

        act.Should().Throw<KeyNotFoundException>();
    }

    [Fact]
    public void TryGet_returns_false_for_unregistered_provider()
    {
        ExternalTicketConnectorRegistry registry = new([]);

        bool found = registry.TryGet(ItsmOutboundIssueProvider.ServiceNow, out IExternalTicketConnector? connector);

        found.Should().BeFalse();
        connector.Should().BeNull();
    }

    private static Mock<IExternalTicketConnector> CreateConnector(ItsmOutboundIssueProvider providerId, string label)
    {
        Mock<IExternalTicketConnector> connector = new();
        connector.SetupGet(static c => c.ProviderId).Returns(providerId);
        connector.SetupGet(static c => c.ProviderLabel).Returns(label);

        return connector;
    }
}
