using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Architecture;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
/// Commit path through the real API host uses production <see cref="ArchLucid.Decisioning.Merge.DecisionEngineService"/> merge
/// (not mocks). These tests assert coordinator traceability invariants that unit tests with mocked merge can miss.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class ArchitectureCommitTraceabilityIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: true) },
    };

    private static StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    [Fact]
    public async Task CommitRun_manifest_decision_trace_ids_align_with_returned_traces()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage createResponse = await client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-COMMIT-TRACE-001")));

        createResponse.EnsureSuccessStatusCode();

        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await client.PostAsync($"/v1/architecture/run/{runId}/execute", null);
        executeResponse.EnsureSuccessStatusCode();

        HttpResponseMessage commitResponse = await client.PostAsync($"/v1/architecture/run/{runId}/commit", null);
        commitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        CommitRunResponse? commitPayload = await commitResponse.Content.ReadFromJsonAsync<CommitRunResponse>(JsonOptions);
        commitPayload.Should().NotBeNull();

        IReadOnlyList<string> gaps = CommittedManifestTraceabilityRules.GetLinkageGaps(
            commitPayload!.Manifest,
            commitPayload.DecisionTraces);

        gaps.Should().BeEmpty("manifest metadata must list exactly the coordinator trace ids returned with the commit body");
    }
}
