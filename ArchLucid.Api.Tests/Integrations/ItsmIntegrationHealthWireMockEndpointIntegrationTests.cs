using System.Net;
using System.Text.Json;

using FluentAssertions;

using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Validates <c>GET /v1/integrations/itsm/health</c> against WireMock upstream using production HTTP registrations.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ItsmIntegrationHealthWireMockEndpointIntegrationTests
{
    [SkippableFact]
    public async Task Get_health_returns_200_when_jira_and_servicenow_probes_succeed()
    {
        await using ItsmOutboundIssuesWireMockApiFactory factory = new();
        WireMockServer wireMock = factory.UpstreamWireMock;
        wireMock.Reset();

        wireMock
            .Given(Request.Create().WithPath("/rest/api/3/myself").UsingGet())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.OK).WithBody(/*lang=json,strict*/ """{"accountId":"wire"}"""));

        wireMock
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingGet())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.OK).WithBody(/*lang=json,strict*/ """{"result":[]}"""));

        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(new Uri("/v1/integrations/itsm/health", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string raw = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(raw);
        doc.RootElement.GetProperty("status").GetString().Should().Be("healthy");
        doc.RootElement.GetProperty("jira").GetProperty("reachable").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("serviceNow").GetProperty("reachable").GetBoolean().Should().BeTrue();
    }

    [SkippableFact]
    public async Task Get_health_returns_503_when_jira_upstream_returns_401()
    {
        await using ItsmOutboundIssuesWireMockApiFactory factory = new();
        WireMockServer wireMock = factory.UpstreamWireMock;
        wireMock.Reset();

        wireMock
            .Given(Request.Create().WithPath("/rest/api/3/myself").UsingGet())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.Unauthorized).WithBody("denied"));

        wireMock
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingGet())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.OK).WithBody(/*lang=json,strict*/ """{"result":[]}"""));

        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(new Uri("/v1/integrations/itsm/health", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);

        string raw = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(raw);
        doc.RootElement.GetProperty("status").GetString().Should().Be("unhealthy");
        doc.RootElement.GetProperty("jira").GetProperty("reachable").GetBoolean().Should().BeFalse();
        doc.RootElement.GetProperty("serviceNow").GetProperty("reachable").GetBoolean().Should().BeTrue();
    }
}
