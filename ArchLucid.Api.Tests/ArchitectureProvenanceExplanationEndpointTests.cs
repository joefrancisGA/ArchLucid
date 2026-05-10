using System.Net;
using System.Net.Http.Json;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Coordinator provenance node explanation: scoped run lookup plus buyer-safe <c>501</c> Problem+JSON (not published in OpenAPI).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class ArchitectureProvenanceExplanationEndpointTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    private static HttpContent SerializeJsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);

        return new StringContent(json, System.Text.Encoding.UTF8, "application/json");
    }

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_singular_run_route_returns_501_problem_details_when_run_exists_in_scope()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage createResponse =
            await client.PostAsync("/v1/architecture/request", SerializeJsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PROV-EXPLAIN-001")));

        createResponse.EnsureSuccessStatusCode();

        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);

        created.Should().NotBeNull();

        string runId = created.Run.RunId;

        HttpResponseMessage response =
            await client.GetAsync($"/v1/architecture/run/{runId}/provenance/test-node/explanation");

        response.StatusCode.Should().Be(HttpStatusCode.NotImplemented);

        JsonDocument body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        body.RootElement.GetProperty("status").GetInt32().Should().Be(501);
        body.RootElement.GetProperty("type").GetString().Should().Be(ProblemTypes.ProvenanceNodeExplanationNotSupported);
        body.RootElement.GetProperty("title").GetString().Should().Be("Provenance node explanation not supported");
        body.RootElement.GetProperty("detail").GetString().Should().Contain("/v1/explain/runs/{runId}/aggregate");
        body.RootElement.GetProperty("errorCode").GetString().Should().Be(ProblemErrorCodes.ProvenanceNodeExplanationNotSupported);
        body.RootElement.GetProperty("aggregateExplanationPathTemplate").GetString().Should()
            .Be("/v1/explain/runs/{runId}/aggregate");
    }

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_plural_runs_alias_matches_singular_behavior()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage createResponse =
            await client.PostAsync("/v1/architecture/request", SerializeJsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PROV-EXPLAIN-002")));

        createResponse.EnsureSuccessStatusCode();

        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);

        string runId = created!.Run.RunId;

        HttpResponseMessage plural =
            await client.GetAsync(
                $"/v1/architecture/runs/{Uri.EscapeDataString(runId)}/provenance/node-b/explanation");

        plural.StatusCode.Should().Be(HttpStatusCode.NotImplemented);
        plural.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_returns_404_when_run_not_in_scope()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        Guid missingRun = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        HttpResponseMessage response =
            await client.GetAsync($"/v1/architecture/run/{missingRun:D}/provenance/a-node/explanation");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
