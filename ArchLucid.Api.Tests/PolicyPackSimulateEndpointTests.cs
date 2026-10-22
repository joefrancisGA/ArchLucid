using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     <c>POST /v1/policy-packs/simulate</c> validation wiring (FluentValidation + controller guards).
/// </summary>
[Trait("Category", "Integration")]
public sealed class PolicyPackSimulateEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Simulate_MissingBody_Returns400()
    {
        HttpResponseMessage response = await Client.PostAsync("/v1/policy-packs/simulate", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Simulate_EmptyRunId_Returns400()
    {
        Dictionary<string, object?> body = new()
        {
            ["runId"] = "   ",
            ["content"] = new Dictionary<string, object?>(),
        };

        HttpResponseMessage response =
            await Client.PostAsync("/v1/policy-packs/simulate", JsonContent(body));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Simulate_NullContent_Returns400()
    {
        Dictionary<string, object?> body = new()
        {
            ["runId"] = Guid.NewGuid().ToString("N"),
            ["content"] = null,
        };

        HttpResponseMessage response =
            await Client.PostAsync("/v1/policy-packs/simulate", JsonContent(body));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Simulate_BlockSeverityOutOfRange_Returns400()
    {
        Dictionary<string, object?> body = new()
        {
            ["runId"] = Guid.NewGuid().ToString("N"),
            ["content"] = new Dictionary<string, object?>(),
            ["blockCommitMinimumSeverity"] = 99,
        };

        HttpResponseMessage response =
            await Client.PostAsync("/v1/policy-packs/simulate", JsonContent(body));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Simulate_UnknownRun_Returns404()
    {
        Dictionary<string, object?> body = new()
        {
            ["runId"] = Guid.NewGuid().ToString("N"),
            ["content"] = new Dictionary<string, object?>(),
        };

        HttpResponseMessage response =
            await Client.PostAsync("/v1/policy-packs/simulate", JsonContent(body));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
