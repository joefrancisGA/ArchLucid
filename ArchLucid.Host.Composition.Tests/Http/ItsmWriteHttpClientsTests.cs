using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup;

using Microsoft.Extensions.DependencyInjection;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmWriteHttpClientsTests
{
    private static readonly AuthenticationHeaderValue TestAuthorization = new("Basic", "test");
    private static readonly Uri JiraIssueUri = new("https://jira.example/rest/api/3/issue");
    private static readonly Uri ServiceNowRoot = new("https://snow.example");
    private static readonly Uri ServiceNowIncidentUri = new(ServiceNowRoot, "/api/now/table/incident");
    private static readonly Uri AzureBoardsCreateUri = new("https://boards.example/org/project/_apis/wit/workitems/$Task");
    private static readonly Uri AzureBoardsProjectsUri = new("https://boards.example/org/_apis/projects");

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Jira_create_is_not_replayed_on_lost_response_or_503(bool dropResponse)
    {
        AcceptingVendorHandler handler = new(dropResponse, """{"key":"TEST-1","id":"1"}""");
        await using ServiceProvider services = CreateServices<JiraOutboundIssueClient>(handler);
        using JsonDocument description = JsonDocument.Parse("""{"type":"doc","version":1,"content":[]}""");

        JiraOutboundIssueHttpResult result = await services.GetRequiredService<JiraOutboundIssueClient>().CreateIssueAsync(
            JiraIssueUri, TestAuthorization, "TEST", "summary", description.RootElement, "Task", "High", CancellationToken.None);

        Assert.Equal(1, handler.AcceptedWrites);
        Assert.False(result.Ok);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        if (dropResponse)
        {
            Assert.Contains("Check for an existing Jira issue", result.ErrorDetail);
        }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ServiceNow_incident_create_is_not_replayed_on_lost_response_or_503(bool dropResponse)
    {
        AcceptingVendorHandler handler = new(dropResponse, """{"result":{"sys_id":"1","number":"INC0001"}}""");
        await using ServiceProvider services = CreateServices<ServiceNowOutboundIncidentClient>(handler);

        ServiceNowIncidentHttpResult result = await services.GetRequiredService<ServiceNowOutboundIncidentClient>().CreateIncidentAsync(
            ServiceNowIncidentUri, TestAuthorization, "summary", "description", "2", "2", null, CancellationToken.None);

        Assert.Equal(1, handler.AcceptedWrites);
        Assert.False(result.Ok);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        if (dropResponse)
        {
            Assert.Contains("Check for an existing ServiceNow incident", result.ErrorDetail);
        }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Azure_Boards_create_is_not_replayed_on_lost_response_or_503(bool dropResponse)
    {
        AcceptingVendorHandler handler = new(dropResponse, """{"id":42}""");
        await using ServiceProvider services = CreateServices<AzureBoardsOutboundIssueClient>(handler);

        AzureBoardsOutboundIssueHttpResult result = await services.GetRequiredService<AzureBoardsOutboundIssueClient>().CreateWorkItemAsync(
            AzureBoardsCreateUri, TestAuthorization, "title", "description", 2, null, null, null, CancellationToken.None);

        Assert.Equal(1, handler.AcceptedWrites);
        Assert.False(result.Ok);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        if (dropResponse)
        {
            Assert.Contains("Check for an existing Azure Boards work item", result.ErrorDetail);
        }
    }

    [Fact]
    public async Task Azure_Boards_project_lookup_still_retries()
    {
        AcceptingVendorHandler handler = new(dropResponse: true, """{"id":42}""", """{"value":[{"name":"Demo"}]}""");
        await using ServiceProvider services = CreateServices<AzureBoardsOutboundIssueClient>(handler);

        AzureBoardsProjectsHttpResult result = await services.GetRequiredService<AzureBoardsOutboundIssueClient>().ListProjectsAsync(
            AzureBoardsProjectsUri, TestAuthorization, CancellationToken.None);

        Assert.True(result.Ok);
        Assert.Equal("Demo", Assert.Single(result.ProjectNames));
        Assert.Equal(2, handler.Reads);
        Assert.Equal(0, handler.AcceptedWrites);
    }

    [Fact]
    public async Task ServiceNow_cmdb_lookup_retries_but_optional_create_does_not()
    {
        AcceptingVendorHandler handler = new(dropResponse: true, """{"result":{"sys_id":"1"}}""");
        await using ServiceProvider services = CreateServices<ServiceNowOutboundIncidentClient>(handler);

        ServiceNowCmdbCiResolveResult result = await services.GetRequiredService<ServiceNowOutboundIncidentClient>()
            .TryResolveCmdbCiApplSysIdAsync(ServiceNowRoot, TestAuthorization, "sample", true, CancellationToken.None);

        Assert.Equal(2, handler.Reads);
        Assert.Equal(1, handler.AcceptedWrites);
        Assert.Null(result.SysId);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
    }

    [Fact]
    public async Task Write_failures_still_open_the_breaker_for_the_named_client()
    {
        using FailingVendorHandler handler = new();
        await using ServiceProvider services = CreateServices<ServiceNowOutboundIncidentClient>(handler);
        using HttpClient client = services.GetRequiredService<IHttpClientFactory>()
            .CreateClient(nameof(ServiceNowOutboundIncidentClient));

        for (int i = 0; i < 2; i++)
        {
            using HttpResponseMessage response = await client.PostAsync(ServiceNowIncidentUri, null);
            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        }

        await Assert.ThrowsAnyAsync<BrokenCircuitException>(() => client.GetAsync(ServiceNowRoot));
        Assert.Equal(2, handler.Sends);
    }

    private static ServiceProvider CreateServices<TClient>(HttpMessageHandler handler)
        where TClient : class
    {
        ServiceCollection services = [];
        services.AddOptions<OutboundExternalHttpResilienceOptions>().Configure(static options =>
        {
            options.MaxRetryAttempts = 1;
            options.MinimumThroughput = 2;
            options.FailureRatio = 1;
        });
        ServiceCollectionExtensions.RegisterItsmWriteHttpClients(services);
        services.AddHttpClient<TClient>().ConfigurePrimaryHttpMessageHandler(() => handler);
        return services.BuildServiceProvider();
    }

    // Count the upstream side effect before either dropping the reply or returning a gateway-style failure.
    private sealed class AcceptingVendorHandler(
        bool dropResponse,
        string createdPayload,
        string readPayload = """{"result":[]}""") : HttpMessageHandler
    {
        public int AcceptedWrites { get; private set; }

        public int Reads { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.Method == HttpMethod.Get)
            {
                return Task.FromResult(++Reads == 1
                    ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                    : new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(readPayload) });
            }

            Assert.Equal(HttpMethod.Post, request.Method);
            if (++AcceptedWrites > 1)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Created) { Content = new StringContent(createdPayload) });
            }

            return dropResponse
                ? Task.FromException<HttpResponseMessage>(new HttpRequestException("The test vendor committed before disconnecting."))
                : Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        }
    }

    private sealed class FailingVendorHandler : HttpMessageHandler
    {
        public int Sends { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Sends++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        }
    }
}
