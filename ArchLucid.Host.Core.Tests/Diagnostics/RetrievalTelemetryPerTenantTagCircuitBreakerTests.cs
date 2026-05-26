using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class RetrievalTelemetryPerTenantTagCircuitBreakerTests
{
    [Fact]
    public void ShouldSuppressTenantIdTags_when_estimate_exceeds_recommended_max()
    {
        RetrievalTelemetryPerTenantTagCircuitBreaker sut = CreateBreaker(
            new RetrievalTelemetryOptions
            {
                RecordPerTenantTags = true,
                EstimatedTenantCount = 150,
                MaxRecommendedTenantCountForPerTenantTags = 100,
            });

        sut.ShouldSuppressTenantIdTags().Should().BeTrue();
    }

    [Fact]
    public void ShouldSuppressTenantIdTags_false_when_per_tenant_tags_disabled()
    {
        RetrievalTelemetryPerTenantTagCircuitBreaker sut = CreateBreaker(
            new RetrievalTelemetryOptions
            {
                RecordPerTenantTags = false,
                EstimatedTenantCount = 500,
                MaxRecommendedTenantCountForPerTenantTags = 100,
            });

        sut.ShouldSuppressTenantIdTags().Should().BeFalse();
    }

    [Fact]
    public void ShouldSuppressTenantIdTags_false_when_estimate_within_recommended_max()
    {
        RetrievalTelemetryPerTenantTagCircuitBreaker sut = CreateBreaker(
            new RetrievalTelemetryOptions
            {
                RecordPerTenantTags = true,
                EstimatedTenantCount = 50,
                MaxRecommendedTenantCountForPerTenantTags = 100,
            });

        sut.ShouldSuppressTenantIdTags().Should().BeFalse();
    }

    private static RetrievalTelemetryPerTenantTagCircuitBreaker CreateBreaker(RetrievalTelemetryOptions options)
    {
        StubOptionsMonitor<RetrievalTelemetryOptions> monitor = new(options);

        return new RetrievalTelemetryPerTenantTagCircuitBreaker(monitor);
    }

    private sealed class StubOptionsMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            public static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
