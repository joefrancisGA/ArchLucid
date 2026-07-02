using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>TB-580 — HybridCache Redis L2 registration and replica-aware TTL tiering.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HotPathCacheRegistrationTests
{
    [Fact]
    public void RegisterHotPathReadCaching_RedisProvider_registers_distributed_cache_and_startup_logger()
    {
        ServiceCollection services = [];
        services.AddLogging();

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["HotPathCache:Enabled"] = "true",
                    ["HotPathCache:Provider"] = "Redis",
                    ["HotPathCache:RedisConnectionString"] = "localhost:6379",
                    ["HotPathCache:ExpectedApiReplicaCount"] = "3",
                })
            .Build();

        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IDistributedCache));
        services.Should().Contain(static d => d.ServiceType == typeof(IHotPathReadCache));
        services.Should().Contain(static d => d.ImplementationType == typeof(HotPathRedisDistributedCacheHostedLogger));
        services.Should().NotContain(static d => d.ImplementationType == typeof(HotPathMemoryReplicaCoherenceHostedLogger));
    }

    [Fact]
    public void RegisterHotPathReadCaching_AutoMultiReplicaWithRedis_resolves_to_redis_l2()
    {
        ServiceCollection services = [];
        services.AddLogging();

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["HotPathCache:Enabled"] = "true",
                    ["HotPathCache:Provider"] = "Auto",
                    ["HotPathCache:RedisConnectionString"] = "localhost:6379",
                    ["HotPathCache:ExpectedApiReplicaCount"] = "2",
                })
            .Build();

        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IDistributedCache));
        services.Should().Contain(static d => d.ImplementationType == typeof(HotPathRedisDistributedCacheHostedLogger));
    }

    [Theory]
    [InlineData(60, 15)]
    [InlineData(8, 2)]
    [InlineData(4, 1)]
    public void ResolveLocalCacheExpiration_redis_l2_uses_shorter_l1(int absoluteSeconds, int expectedLocalSeconds)
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = absoluteSeconds };

        TimeSpan local = ArchLucidStorageServiceCollectionExtensions.ResolveLocalCacheExpiration(
            options,
            distributedL2Enabled: true,
            absoluteSeconds);

        local.Should().Be(TimeSpan.FromSeconds(expectedLocalSeconds));
    }

    [Fact]
    public void ResolveLocalCacheExpiration_memory_only_matches_absolute_ttl()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 60 };

        TimeSpan local = ArchLucidStorageServiceCollectionExtensions.ResolveLocalCacheExpiration(
            options,
            distributedL2Enabled: false,
            60);

        local.Should().Be(TimeSpan.FromSeconds(60));
    }
}
