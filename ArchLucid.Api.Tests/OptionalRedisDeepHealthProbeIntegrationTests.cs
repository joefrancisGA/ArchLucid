using System.Net;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Regression: configuring Redis probes <c>/health</c> (anonymous) when Redis connection strings are supplied.
/// </summary>
[Trait("Category", "Integration")]
public sealed class OptionalRedisDeepHealthProbeIntegrationTests : IClassFixture<RedisUnreachableHealthProbeApiFactory>
{
    private readonly RedisUnreachableHealthProbeApiFactory _factory;

    public OptionalRedisDeepHealthProbeIntegrationTests(RedisUnreachableHealthProbeApiFactory factory)
    {
        _factory = factory;
    }

    [SkippableFact]
    public async Task Health_anonymous_includes_database_and_redis_summary_entries()
    {
        using HttpClient client = _factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health");

        // Optional Redis registers as degraded when unreachable; overall report degrades but `/health` stays 200
        // (Unhealthy checks would drive 503 via the default writer).
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();

        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement entries = doc.RootElement.GetProperty("entries");

        entries.GetArrayLength().Should().Be(2);

        entries
            .EnumerateArray()
            .Select(static e => e.GetProperty("name").GetString())
            .Should()
            .BeEquivalentTo("database", "redis");
    }
}
