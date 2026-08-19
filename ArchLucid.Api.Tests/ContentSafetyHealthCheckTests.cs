using ArchLucid.Api.Health;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class ContentSafetyHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_when_disabled_returns_healthy()
    {
        ContentSafetyHealthCheck check = CreateCheck(new ContentSafetyOptions { Enabled = false });

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("disabled");
    }

    [Theory]
    [InlineData(null, "secret")]
    [InlineData("https://example.cognitiveservices.azure.com/", null)]
    [InlineData("", "secret")]
    [InlineData("https://example.cognitiveservices.azure.com/", "")]
    public async Task CheckHealthAsync_when_enabled_without_configuration_returns_unhealthy(
        string? endpoint,
        string? apiKey)
    {
        ContentSafetyHealthCheck check = CreateCheck(
            new ContentSafetyOptions
            {
                Enabled = true,
                Endpoint = endpoint,
                ApiKey = apiKey,
            });

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("not configured");
    }

    private static ContentSafetyHealthCheck CreateCheck(ContentSafetyOptions options)
    {
        return new ContentSafetyHealthCheck(new StaticOptionsMonitor<ContentSafetyOptions>(options));
    }

    private sealed class StaticOptionsMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
