using Xunit;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>
///     WireMock listens on ephemeral ports; under heavy parallel test load the Jira outbound client can hit its HTTP
///     timeout (<see cref="JiraOutboundIssueClient" /> maps that to <see cref="System.Net.HttpStatusCode.ServiceUnavailable" />).
///     Serialize these tests so WireMock stays responsive.
/// </summary>
[CollectionDefinition("ItsmOutboundJiraWireMock", DisableParallelization = true)]
public sealed class ItsmOutboundJiraWireMockCollectionFixture
{
}
