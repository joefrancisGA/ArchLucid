using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Full-stack coverage for <c>POST /v1/integrations/itsm/outbound/issues</c>: controller, outbound service,
///     typed HTTP clients (via <see cref="RecordingOutboundHttpHandler" />), correlation persistence, and durable audit append.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ItsmOutboundIssuesEndpointIntegrationTests
{
    private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

    private static string DemoPrimaryFindingId =>
        $"finding-demo-{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:N}-primary";

    private static StringContent OutboundIssueBody(string provider, string findingId)
    {
        string json = JsonSerializer.Serialize(
            new Dictionary<string, string> { ["provider"] = provider, ["findingId"] = findingId },
            JsonWeb);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private static async Task SeedDemoBaselineAsync(IServiceProvider rootServices)
    {
        using IServiceScope scope = rootServices.CreateScope();

        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    [SkippableFact]
    public async Task Post_jira_upstream_created_returns_external_key_correlation_and_audit()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new();
        factory.OutboundHttp.RespondAsync = (_, _) =>
            Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent("{\"id\":\"441\",\"key\":\"DP-900\"}", Encoding.UTF8, "application/json")
                });

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            OutboundIssueBody("Jira", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonDocument body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("provider").GetString().Should().Be("Jira");
        body.RootElement.GetProperty("externalKey").GetString().Should().Be("DP-900");

        using IServiceScope scope = factory.Services.CreateScope();
        IItsmFindingCorrelationRepository correlations =
            scope.ServiceProvider.GetRequiredService<IItsmFindingCorrelationRepository>();

        ItsmFindingCorrelationRecord? row =
            await correlations.TryGetByExternalKeyAsync("Jira", "DP-900", CancellationToken.None);

        row.Should().NotBeNull();
        row!.FindingId.Should().Be(DemoPrimaryFindingId);

        factory.AuditCapture.Snapshot()
            .Select(static a => a.EventType)
            .Should()
            .Contain(AuditEventTypes.IntegrationJiraIssueCreateSucceeded);
    }

    [SkippableFact]
    public async Task Post_jira_upstream_unauthorized_returns_503_problem_with_provider_and_correlation_id()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new();
        factory.OutboundHttp.RespondAsync = (_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized));

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            OutboundIssueBody("Jira", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);

        JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        problem.RootElement.GetProperty("detail").GetString().Should().NotBeNullOrWhiteSpace();
        problem.RootElement.GetProperty("provider").GetString().Should().Be("Jira");
        problem.RootElement.TryGetProperty(ProblemCorrelation.ExtensionKey, out JsonElement cid).Should().BeTrue();
        cid.GetString().Should().NotBeNullOrWhiteSpace();

        factory.AuditCapture.Snapshot()
            .Select(static a => a.EventType)
            .Should()
            .Contain(AuditEventTypes.IntegrationJiraIssueCreateFailed);
    }

    [SkippableFact]
    public async Task Post_jira_upstream_slow_returns_503_timeout_detail()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new(TimeSpan.FromMilliseconds(120));
        factory.OutboundHttp.RespondAsync = async (_, ct) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), ct);

            return new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{\"id\":\"1\",\"key\":\"DP-1\"}", Encoding.UTF8, "application/json")
            };
        };

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            OutboundIssueBody("Jira", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);

        JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        problem.RootElement.GetProperty("detail").GetString().Should().Contain("timed out");

        factory.AuditCapture.Snapshot()
            .Select(static a => a.EventType)
            .Should()
            .Contain(AuditEventTypes.IntegrationJiraIssueCreateFailed);
    }

    [SkippableFact]
    public async Task Post_when_jira_connector_unconfigured_returns_400_skip_problem_with_provider_extension()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new()
        {
            IncludeJiraOutboundHostConfiguration = false
        };

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            OutboundIssueBody("Jira", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        problem.RootElement.GetProperty("detail").GetString().Should().Contain("not configured");
        problem.RootElement.GetProperty("provider").GetString().Should().Be("Jira");

        factory.AuditCapture.Snapshot()
            .Select(static a => a.EventType)
            .Should()
            .Contain(AuditEventTypes.IntegrationJiraIssueCreateSkipped);
    }

    [SkippableFact]
    public async Task Post_when_provider_invalid_returns_400_problem_including_requested_provider()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new();

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.PostAsync("/v1/integrations/itsm/outbound/issues", OutboundIssueBody("Freshdesk", "any"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        problem.RootElement.GetProperty("provider").GetString().Should().Be("Freshdesk");
        problem.RootElement.GetProperty("findingId").GetString().Should().Be("any");
    }

    [SkippableFact]
    public async Task Post_servicenow_upstream_created_returns_sys_id_correlation_and_audit()
    {
        await using ItsmOutboundIssuesIntegrationApiFactory factory = new()
        {
            IncludeJiraOutboundHostConfiguration = false,
            IncludeServiceNowOutboundHostConfiguration = true
        };

        factory.OutboundHttp.RespondAsync = (request, _) =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Contains("cmdb_ci_appl", StringComparison.Ordinal) && request.Method == HttpMethod.Get)
            {
                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json")
                    });
            }

            if (path.EndsWith("/incident", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(
                            "{\"result\":{\"sys_id\":\"sn-sys-42\",\"number\":\"INC900\"}}",
                            Encoding.UTF8,
                            "application/json")
                    });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest));
        };

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            OutboundIssueBody("ServiceNow", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonDocument body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("provider").GetString().Should().Be("ServiceNow");
        body.RootElement.GetProperty("externalKey").GetString().Should().Be("sn-sys-42");

        using IServiceScope scope = factory.Services.CreateScope();
        IItsmFindingCorrelationRepository correlations =
            scope.ServiceProvider.GetRequiredService<IItsmFindingCorrelationRepository>();

        ItsmFindingCorrelationRecord? row =
            await correlations.TryGetByExternalKeyAsync("ServiceNow", "sn-sys-42", CancellationToken.None);

        row.Should().NotBeNull();
        row!.FindingId.Should().Be(DemoPrimaryFindingId);

        factory.AuditCapture.Snapshot()
            .Select(static a => a.EventType)
            .Should()
            .Contain(AuditEventTypes.IntegrationServiceNowIncidentCreateSucceeded);
    }
}
