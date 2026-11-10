using System.Net;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Coordinator provenance node explanation: scoped run lookup plus buyer-safe <c>501</c> Problem+JSON (not published in OpenAPI).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureProvenanceExplanationEndpointTests
{
    private static readonly JsonSerializerOptions JsonOptions = IntegrationTestBase.CreateRelaxedEscapingJsonOptions();

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_singular_run_route_returns_501_problem_details_when_run_exists_in_scope()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, _) =>
        {
            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(
                TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario("PROV-EXPLAIN")));

            CreateRunResponseDto created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;

            HttpResponseMessage response =
                await client.GetAsync($"/v1/architecture/review/{runId}/provenance/test-node/explanation");

            JsonDocument body = await response.AssertProblemForTestAsync(
                HttpStatusCode.NotImplemented,
                ProblemTypes.ProvenanceNodeExplanationNotSupported,
                ProblemErrorCodes.ProvenanceNodeExplanationNotSupported);

            body.RootElement.GetProperty("title").GetString().Should().Be("Provenance node explanation not supported");
            body.RootElement.GetProperty("detail").GetString().Should().Contain("/v1/explain/runs/{runId}/aggregate");
            body.RootElement.GetProperty("aggregateExplanationPathTemplate").GetString().Should()
                .Be("/v1/explain/runs/{runId}/aggregate");
        });
    }

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_plural_runs_alias_matches_singular_behavior()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, _) =>
        {
            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(
                TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario("PROV-EXPLAIN-PLURAL")));

            CreateRunResponseDto created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;

            HttpResponseMessage plural =
                await client.GetAsync(
                    $"/v1/architecture/reviews/{Uri.EscapeDataString(runId)}/provenance/node-b/explanation");

            plural.StatusCode.Should().Be(HttpStatusCode.NotImplemented);
            plural.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        });
    }

    [SkippableFact]
    public async Task GetProvenanceNodeExplanation_returns_404_when_run_not_in_scope()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, _) =>
        {
            Guid missingRun = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

            HttpResponseMessage response =
                await client.GetAsync($"/v1/architecture/review/{missingRun:D}/provenance/a-node/explanation");

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        });
    }
}
