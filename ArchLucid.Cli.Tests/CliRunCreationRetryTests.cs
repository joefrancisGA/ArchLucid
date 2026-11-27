using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CliRunCreationRetryTests
{
    private const string RequestId = "cli-run-creation-retry";
    private const string StableKey = "bc5acbf6-afa7-419e-b594-3d543d2863bf";

    [Theory]
    [InlineData(null, StableKey, true, 2)]
    [InlineData(ArchitectureWorkflowIntent.StartReview, StableKey, false, 2)]
    [InlineData("START-REVIEW", StableKey, true, 2)]
    [InlineData(null, null, true, 1)]
    [InlineData(ArchitectureWorkflowIntent.StartReview, null, false, 1)]
    [InlineData(ArchitectureWorkflowIntent.StartReview, " ", false, 1)]
    [InlineData(ArchitectureWorkflowIntent.CreateArchitecture, StableKey, true, 1)]
    [InlineData("CREATE-ARCHITECTURE", StableKey, false, 1)]
    [InlineData(ArchitectureWorkflowIntent.CreateArchitecture, null, false, 1)]
    [InlineData("future-intent", StableKey, false, 1)]
    public async Task CreateRunAsync_RetriesOnlyKeyedStandardRuns(
        string? workflowIntent, string? idempotencyKey, bool loseResponse, int expectedSends)
    {
        CaptureTransport transport = new(loseResponse);
        using HttpClient http = new(new CliRetryDelegatingHandler(new CliResilienceOptions
        {
            MaxRetryAttempts = 1,
            InitialDelaySeconds = 0
        })
        {
            InnerHandler = transport
        })
        {
            BaseAddress = new Uri("https://synthetic.invalid/")
        };
        ArchLucidApiClient client = new(http);
        ArchitectureRequest request = new()
        {
            RequestId = RequestId,
            Description = "An in-process test architecture request",
            SystemName = "RetryTest",
            Environment = "test",
            WorkflowIntent = workflowIntent
        };

        ArchLucidApiClient.CreateRunResult result = await client.CreateRunAsync(
            request, idempotencyKey: idempotencyKey is null ? null : $" {idempotencyKey} ");

        Assert.False(result.Success);
        int? expectedStatus = expectedSends == 2 ? (int)HttpStatusCode.BadRequest
            : loseResponse ? null : (int)HttpStatusCode.ServiceUnavailable;

        Assert.Equal(expectedStatus, result.StatusCode);
        Assert.Equal(expectedSends, transport.Sends.Count);
        string originalBody = transport.Sends[0].Body;
        string[] expectedKeys = string.IsNullOrWhiteSpace(idempotencyKey) ? [] : [idempotencyKey];

        Assert.All(transport.Sends, send =>
        {
            Assert.Equal(HttpMethod.Post, send.Method);
            Assert.Equal("/v1/architecture/request", send.Path);
            Assert.Equal(expectedKeys, send.Keys);
            Assert.Equal(originalBody, send.Body);
            using JsonDocument json = JsonDocument.Parse(send.Body);
            Assert.Equal(RequestId, json.RootElement.GetProperty("requestId").GetString());
            string? sentIntent = json.RootElement.TryGetProperty("workflowIntent", out JsonElement intent)
                ? intent.GetString()
                : null;
            Assert.Equal(workflowIntent, sentIntent);
        });
    }

    private sealed class CaptureTransport(bool loseResponse) : HttpMessageHandler
    {
        public List<(HttpMethod Method, string Path, string[] Keys, string Body)> Sends { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string[] keys = request.Headers.TryGetValues("Idempotency-Key", out IEnumerable<string>? values)
                ? values.ToArray()
                : [];
            string body = await request.Content!.ReadAsStringAsync(cancellationToken);
            Sends.Add((request.Method, request.RequestUri!.AbsolutePath, keys, body));

            if (Sends.Count == 1)
            {
                if (loseResponse)
                    throw new HttpRequestException("Synthetic response lost after the request body was observed.");

                return Respond(HttpStatusCode.ServiceUnavailable);
            }

            return Respond(HttpStatusCode.BadRequest);
        }

        private static HttpResponseMessage Respond(HttpStatusCode statusCode)
        {
            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent("""{"detail":"Synthetic test response."}""")
            };
        }
    }
}
