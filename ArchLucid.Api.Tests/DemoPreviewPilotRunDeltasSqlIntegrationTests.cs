using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL-backed smoke for CI demo gates: seed, anonymous preview, and pilot-run-deltas must not return retryable 503s
///     from deterministic query faults (for example duplicate <c>WITH (NOLOCK)</c> in value-report metrics SQL).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class DemoPreviewPilotRunDeltasSqlIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    [SkippableFact]
    public async Task Demo_seed_preview_and_pilot_run_deltas_succeed_on_sql_storage()
    {
        await using ArchLucidApiFactory factory = new(sqlAuthorityStorage: true);
        await factory.InitializeAsync();

        WebApplicationFactory<Program> host = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?> { ["Demo:Enabled"] = "true" }));
        });

        HttpClient client = host.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage seed = await client.PostAsync(
            "/v1/demo/seed",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        seed.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK);

        using HttpResponseMessage preview = await client.GetAsync("/v1/demo/preview");
        preview.StatusCode.Should().Be(HttpStatusCode.OK);

        DemoPreviewRunIdPayload? previewBody =
            await preview.Content.ReadFromJsonAsync<DemoPreviewRunIdPayload>(JsonOptions);
        previewBody.Should().NotBeNull();
        previewBody!.Run.RunId.Should().NotBeNullOrWhiteSpace();

        string runId = previewBody.Run.RunId;
        using HttpResponseMessage deltas = await client.GetAsync($"/v1/pilots/runs/{runId}/pilot-run-deltas");

        deltas.StatusCode.Should().NotBe(
            HttpStatusCode.ServiceUnavailable,
            because: "pilot-run-deltas must not mask SQL programming faults as retryable database outages");
        deltas.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed class DemoPreviewRunIdPayload
    {
        public DemoPreviewRunRef Run
        {
            get;
            init;
        } = new();
    }

    private sealed class DemoPreviewRunRef
    {
        public string RunId
        {
            get;
            init;
        } = "";
    }
}
