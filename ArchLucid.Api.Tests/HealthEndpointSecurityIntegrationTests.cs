using System.Net;
using System.Text.Json;

using ArchLucid.Host.Core.Health;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Regression: anonymous callers receive summary payloads on <c>/health/ready</c> and <c>/health</c>
///     (deep SQL plus optional Redis summary when configured). <c>/health/diagnostics</c> requires ReadAuthority;
///     <c>/health/detailed</c> requires AdminAuthority and only circuit breakers, SQL, and distributed cache probes.
/// </summary>
[Trait("Category", "Integration")]
public sealed class HealthEndpointSecurityIntegrationTests(HealthEndpointSecurityApiFactory factory)
    : IClassFixture<HealthEndpointSecurityApiFactory>
{
    [SkippableFact]
    public async Task HealthReady_anonymous_returns_summary_without_error_or_version_fields()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health/ready");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        // CD script scripts/ci/cd-post-deploy-verify.sh expects top-level status (summary writer).
        root.GetProperty("status").GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("version", out _).Should().BeFalse("anonymous readiness must not expose build version");
        root.TryGetProperty("commitSha", out _).Should().BeFalse();
        root.TryGetProperty("totalDurationMs", out _).Should().BeFalse();

        root.TryGetProperty("agentExecutionMode", out JsonElement agentMode).Should().BeTrue();
        agentMode.GetString().Should().NotBeNullOrWhiteSpace();

        bool sawAgentExecutionModeEntry = false;

        foreach (JsonElement entry in root.GetProperty("entries").EnumerateArray())
        {
            entry.TryGetProperty("error", out _).Should().BeFalse("summary entries must not expose exception text");
            entry.TryGetProperty("description", out _).Should().BeFalse();
            entry.TryGetProperty("durationMs", out _).Should().BeFalse();
            entry.GetProperty("name").GetString().Should().NotBeNullOrWhiteSpace();
            entry.GetProperty("status").GetString().Should().NotBeNullOrWhiteSpace();

            if (string.Equals(
                    entry.GetProperty("name").GetString(),
                    AgentExecutionModeHealthCheck.RegistrationName,
                    StringComparison.Ordinal))
            {
                sawAgentExecutionModeEntry = true;
                entry.GetProperty("status").GetString().Should().Be("Healthy");
            }
        }

        sawAgentExecutionModeEntry.Should().BeTrue();
        agentMode.GetString().Should().BeOneOf("Simulator", "Real");
    }

    [SkippableFact]
    public async Task Health_anonymous_returns_database_summary_without_error_fields()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        root.GetProperty("status").GetString().Should().NotBeNullOrWhiteSpace();

        JsonElement entries = root.GetProperty("entries");
        entries.GetArrayLength().Should().Be(1);

        JsonElement entry = entries[0];
        entry.GetProperty("name").GetString().Should().Be("database");
        root.TryGetProperty("version", out _).Should().BeFalse();
        root.TryGetProperty("commitSha", out _).Should().BeFalse();

        foreach (JsonElement e in entries.EnumerateArray())
        {
            e.TryGetProperty("error", out _).Should().BeFalse("summary entries must not expose exception text");
            e.TryGetProperty("description", out _).Should().BeFalse();
            e.TryGetProperty("durationMs", out _).Should().BeFalse();
        }
    }

    [SkippableFact]
    public async Task Health_diagnostics_anonymous_returns_401()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health/diagnostics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Health_diagnostics_with_api_key_returns_detailed_payload()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", HealthEndpointSecurityApiFactory.IntegrationTestAdminApiKey);

        HttpResponseMessage response = await client.GetAsync("/health/diagnostics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        root.TryGetProperty("version", out JsonElement version).Should().BeTrue();
        version.GetString().Should().NotBeNullOrWhiteSpace();
        root.TryGetProperty("commitSha", out _).Should().BeTrue();
        root.TryGetProperty("totalDurationMs", out _).Should().BeTrue();

        JsonElement first = root.GetProperty("entries")[0];
        first.TryGetProperty("durationMs", out _).Should().BeTrue();
    }

    [SkippableFact]
    public async Task Health_with_api_key_includes_circuit_breakers_entry_with_data()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", HealthEndpointSecurityApiFactory.IntegrationTestAdminApiKey);

        HttpResponseMessage response = await client.GetAsync("/health/diagnostics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        JsonElement circuitEntry = root
            .GetProperty("entries")
            .EnumerateArray()
            .First(e =>
                string.Equals(
                    e.GetProperty("name").GetString(),
                    "circuit_breakers",
                    StringComparison.Ordinal));

        circuitEntry.GetProperty("status").GetString().Should().Be("Healthy");
        circuitEntry.TryGetProperty("data", out JsonElement data).Should()
            .BeTrue("detailed health must surface HealthCheckResult.Data for operators");
        data.TryGetProperty("gates", out JsonElement gates).Should().BeTrue();
        gates.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [SkippableFact]
    public async Task Health_detailed_anonymous_returns_401()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health/detailed");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Health_detailed_with_reader_api_key_returns_403()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", HealthEndpointSecurityApiFactory.IntegrationTestReaderApiKey);

        HttpResponseMessage response = await client.GetAsync("/health/detailed");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Health_detailed_with_admin_api_key_returns_operational_subset()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", HealthEndpointSecurityApiFactory.IntegrationTestAdminApiKey);

        HttpResponseMessage response = await client.GetAsync("/health/detailed");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        root.TryGetProperty("version", out _).Should().BeTrue();
        root.TryGetProperty("commitSha", out _).Should().BeTrue();

        string[] names = root.GetProperty("entries")
            .EnumerateArray()
            .Select(e => e.GetProperty("name").GetString())
            .Where(n => n is not null)
            .Cast<string>()
            .OrderBy(static n => n, StringComparer.Ordinal)
            .ToArray();

        names.Should().Equal(
        [
            "circuit_breakers",
            "database",
            "distributed_cache",
        ]);

        JsonElement cacheEntry = root
            .GetProperty("entries")
            .EnumerateArray()
            .First(e => string.Equals(e.GetProperty("name").GetString(), "distributed_cache", StringComparison.Ordinal));

        cacheEntry.TryGetProperty("data", out JsonElement cacheData).Should().BeTrue();
        cacheData.GetProperty("registered").GetBoolean().Should().BeFalse("integration host does not register IDistributedCache");
        cacheData.GetProperty("reachable").GetBoolean().Should().BeFalse();
    }
}
