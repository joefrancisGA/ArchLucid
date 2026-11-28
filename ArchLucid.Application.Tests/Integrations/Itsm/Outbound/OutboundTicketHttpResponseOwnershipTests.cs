using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm.Outbound;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Category", "Unit")]
public sealed class OutboundTicketHttpResponseOwnershipTests
{
    public enum Operation { JiraCreate, BoardsCreate, BoardsProjects, BoardsWorkItemTypes }

    [Theory]
    [InlineData(Operation.JiraCreate, true)]
    [InlineData(Operation.JiraCreate, false)]
    [InlineData(Operation.BoardsCreate, true)]
    [InlineData(Operation.BoardsCreate, false)]
    [InlineData(Operation.BoardsProjects, true)]
    [InlineData(Operation.BoardsProjects, false)]
    [InlineData(Operation.BoardsWorkItemTypes, true)]
    [InlineData(Operation.BoardsWorkItemTypes, false)]
    public async Task Vendor_response_content_is_disposed_after_result_mapping(Operation operation, bool ok)
    {
        HttpStatusCode expectedStatus = ok ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
        string body = !ok ? "fixture error" : operation switch
        {
            Operation.JiraCreate => """{"key":"DEMO-42","id":"42"}""",
            Operation.BoardsCreate => """{"id":42}""",
            _ => """{"value":[{"name":"Fixture"}]}""",
        };
        using TrackingContent content = new(body);
        using HttpResponseMessage response = new(expectedStatus) { Content = content };
        using HttpClient http = new(new SingleResponseHandler(response));
        Uri uri = new("https://example.test/no-network");
        AuthenticationHeaderValue authorization = new("Bearer", "fixture-token");
        AzureBoardsOutboundIssueClient boards = new(http, NullLogger<AzureBoardsOutboundIssueClient>.Instance);

        switch (operation)
        {
            case Operation.JiraCreate:
                JiraOutboundIssueClient jira = new(http, NullLogger<JiraOutboundIssueClient>.Instance);
                using (JsonDocument description = JsonDocument.Parse("{}"))
                {
                    JiraOutboundIssueHttpResult result = await jira.CreateIssueAsync(
                        uri, authorization, "DEMO", "Fixture", description.RootElement, "Task", "Medium", CancellationToken.None);
                    Assert.Equal((ok, expectedStatus, ok ? "DEMO-42" : null, ok ? null : body),
                        (result.Ok, result.StatusCode, result.IssueKey, result.ErrorDetail));
                }
                break;
            case Operation.BoardsCreate:
                AzureBoardsOutboundIssueHttpResult workItem = await boards.CreateWorkItemAsync(
                    uri, authorization, "Fixture", "Description", 2, null, null, null, CancellationToken.None);
                Assert.Equal((ok, expectedStatus, ok ? "42" : null, ok ? null : body),
                    (workItem.Ok, workItem.StatusCode, workItem.WorkItemId, workItem.ErrorDetail));
                break;
            case Operation.BoardsProjects:
                AzureBoardsProjectsHttpResult projects = await boards.ListProjectsAsync(uri, authorization, CancellationToken.None);
                Assert.Equal((ok, expectedStatus, ok ? null : body), (projects.Ok, projects.StatusCode, projects.ErrorDetail));
                Assert.Equal(ok ? ["Fixture"] : Array.Empty<string>(), projects.ProjectNames);
                break;
            case Operation.BoardsWorkItemTypes:
                AzureBoardsWorkItemTypesHttpResult types =
                    await boards.ListWorkItemTypesAsync(uri, authorization, CancellationToken.None);
                Assert.Equal((ok, expectedStatus, ok ? null : body), (types.Ok, types.StatusCode, types.ErrorDetail));
                Assert.Equal(ok ? ["Fixture"] : Array.Empty<string>(), types.WorkItemTypeNames);
                break;
        }

        Assert.True(content.WasDisposed, $"{operation} did not dispose the consumed HTTP response content.");
    }

    private sealed class TrackingContent(string body) : StringContent(body, Encoding.UTF8, "application/json")
    {
        public bool WasDisposed { get; private set; }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                WasDisposed = true;
            base.Dispose(disposing);
        }
    }

    private sealed class SingleResponseHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(response);
    }
}
