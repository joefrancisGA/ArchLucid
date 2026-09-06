using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>
///     Unit tests for ArchLucidApiClient using mocked HTTP (no real API).
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArchLucidApiClientHttpTests
{
    private static readonly JsonSerializerOptions SJsonCamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static ArchLucidApiClient CreateClient(HttpResponseMessage response)
    {
        MockHttpMessageHandler handler = new(response);
        HttpClient http = new(handler)
        {
            BaseAddress = new Uri("http://localhost")
        };
        return new ArchLucidApiClient(http);
    }

    private static ArchitectureRequest CreateValidRequest()
    {
        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = "A test architecture request with enough length",
            SystemName = "TestSystem",
            Environment = "prod"
        };
    }

    [Fact]
    public async Task CreateRunAsync_On201_ReturnsSuccessAndRunId()
    {
        const string runId = "run-abc-123";
        string json = JsonSerializer.Serialize(
            new
            {
                run = new
                {
                    runId,
                    requestId = "req-1",
                    status = "Created",
                    createdUtc = TimeProvider.System.UtcNowDateTime(),
                    currentManifestVersion = (string?)null,
                    structuralExecutionMode = "Simulator",
                },
                tasks = Array.Empty<object>()
            }, SJsonCamelCase);
        HttpResponseMessage response = new(HttpStatusCode.Created)
        {
            Content = new StringContent(json)
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.CreateRunResult result = await client.CreateRunAsync(CreateValidRequest());

        result.Success.Should().BeTrue();
        result.Response.Should().NotBeNull();
        result.Response!.Run.RunId.Should().Be(runId);
        result.Error.Should().BeNull();
    }

    [Fact]
    public async Task CreateRunAsync_On400_ReturnsFailureWithParsedError()
    {
        string json = JsonSerializer.Serialize(new
        {
            detail = "Validation failed"
        });
        HttpResponseMessage response = new(HttpStatusCode.BadRequest)
        {
            Content = new StringContent(json)
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.CreateRunResult result = await client.CreateRunAsync(CreateValidRequest());

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Validation failed");
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task GetRunAsync_On200_ReturnsGetRunResult()
    {
        string runId = "run-x";
        string json = JsonSerializer.Serialize(
            new
            {
                run = new
                {
                    runId,
                    requestId = "req-1",
                    status = "Created",
                    createdUtc = TimeProvider.System.UtcNowDateTime(),
                    currentManifestVersion = (string?)null,
                    structuralExecutionMode = "Simulator",
                },
                tasks = Array.Empty<object>(),
                results = Array.Empty<object>()
            }, SJsonCamelCase);
        HttpResponseMessage response = new(HttpStatusCode.OK)
        {
            Content = new StringContent(json)
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.GetRunResult? result = await client.GetRunAsync(runId);

        result.Should().NotBeNull();
        result.Run.RunId.Should().Be(runId);
        result.Tasks.Should().BeEmpty();
        result.Results.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRunAsync_On404_ReturnsNull()
    {
        HttpResponseMessage response = new(HttpStatusCode.NotFound);

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.GetRunResult? result = await client.GetRunAsync("nonexistent");

        result.Should().BeNull();
    }

    [Theory]
    [InlineData(AgentType.Topology)]
    [InlineData(AgentType.Cost)]
    [InlineData(AgentType.Compliance)]
    [InlineData(AgentType.Critic)]
    public async Task SubmitAgentResultAsync_writes_contract_agent_type_name(AgentType agentType)
    {
        HttpResponseMessage response = new(HttpStatusCode.OK)
        {
            Content = new StringContent("""{"resultId":"result-1"}""")
        };
        CapturingHttpMessageHandler handler = new(response);
        HttpClient http = new(handler) { BaseAddress = new Uri("http://localhost") };
        ArchLucidApiClient client = new(http);
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            AgentType = agentType,
            Confidence = 0.8
        };

        ArchLucidApiClient.SubmitResultResult? submitted =
            await client.SubmitAgentResultAsync("run-1", result);

        submitted.Should().NotBeNull();
        submitted!.Success.Should().BeTrue();
        using JsonDocument body = JsonDocument.Parse(handler.RequestBody!);
        body.RootElement.GetProperty("result").GetProperty("agentType").GetString()
            .Should().Be(agentType.ToString());
    }

    [Fact]
    public async Task CommitRunAsync_On200_ReturnsSuccessAndManifestVersion()
    {
        string version = "v2";
        string json = JsonSerializer.Serialize(
            new
            {
                manifest = new
                {
                    runId = "run-1",
                    systemName = "Test",
                    metadata = new
                    {
                        manifestVersion = version
                    }
                },
                warnings = Array.Empty<string>()
            }, SJsonCamelCase);
        HttpResponseMessage response = new(HttpStatusCode.OK)
        {
            Content = new StringContent(json)
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.CommitRunResult? result = await client.CommitRunAsync("run-1");

        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Response.Should().NotBeNull();
        result.Response!.Manifest.Metadata.ManifestVersion.Should().Be(version);
    }

    [Fact]
    public async Task CommitRunAsync_On409_ReturnsFailureWithHttpStatusCode()
    {
        string json = JsonSerializer.Serialize(new
        {
            detail = "Conflict with current state."
        });
        HttpResponseMessage response = new(HttpStatusCode.Conflict)
        {
            Content = new StringContent(json)
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucidApiClient.CommitRunResult? result = await client.CommitRunAsync("run-1");

        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.HttpStatusCode.Should().Be(409);
        result.Error!.ToLowerInvariant().Should().Contain("conflict");
    }

    [Fact]
    public async Task CheckHealthAsync_On200_ReturnsTrue()
    {
        HttpResponseMessage response = new(HttpStatusCode.OK);

        ArchLucidApiClient client = CreateClient(response);
        bool result = await client.CheckHealthAsync();

        result.Should().BeTrue();
    }

    [Fact]
    public async Task CheckHealthAsync_On503_ReturnsFalse()
    {
        HttpResponseMessage response = new((HttpStatusCode)503);

        ArchLucidApiClient client = CreateClient(response);
        bool result = await client.CheckHealthAsync();

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ListArchitecturesAsync_On200_ReturnsPagedIdentities()
    {
        Guid architectureId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid draftId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string json = JsonSerializer.Serialize(
            new
            {
                items = new[]
                {
                    new
                    {
                        architectureId,
                        displayName = "Payments platform",
                        updatedUtc = "2026-01-01T00:00:00Z",
                        currentDraftId = draftId,
                        draftCount = 1,
                        reviewCount = 2,
                    },
                },
                totalCount = 1,
                page = 1,
                pageSize = 50,
                archivedHiddenCount = 0,
                hasMore = false,
            },
            SJsonCamelCase);
        HttpResponseMessage response = new(HttpStatusCode.OK)
        {
            Content = new StringContent(json),
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        ArchLucidApiClient client = CreateClient(response);
        ArchLucid.Contracts.Architecture.ArchitectureIdentityListPage? result =
            await client.ListArchitecturesAsync(1, 50);

        result.Should().NotBeNull();
        result!.Items.Should().HaveCount(1);
        result.Items[0].ArchitectureId.Should().Be(architectureId);
        result.Items[0].CurrentDraftId.Should().Be(draftId);
    }

    [Fact]
    public async Task GetArchitectureAsync_On404_ReturnsNull()
    {
        HttpResponseMessage response = new(HttpStatusCode.NotFound);

        ArchLucidApiClient client = CreateClient(response);
        ArchLucid.Contracts.Architecture.ArchitectureIdentityDetail? result =
            await client.GetArchitectureAsync(Guid.Parse("11111111-1111-1111-1111-111111111111"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task ListArchitecturesAsync_On401_ReturnsNull()
    {
        HttpResponseMessage response = new(HttpStatusCode.Unauthorized);

        ArchLucidApiClient client = CreateClient(response);
        ArchLucid.Contracts.Architecture.ArchitectureIdentityListPage? result =
            await client.ListArchitecturesAsync(1, 50);

        result.Should().BeNull();
    }

    private sealed class MockHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(response);
        }
    }

    private sealed class CapturingHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            return response;
        }
    }
}
