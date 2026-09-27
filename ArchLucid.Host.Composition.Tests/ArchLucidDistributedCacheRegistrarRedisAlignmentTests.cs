using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Persistence.Coordination.Caching;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
public sealed class ArchLucidDistributedCacheRegistrarRedisAlignmentTests
{
    [Fact]
    public void ResolveGraphProjectionRedisConnectionString_when_cache_already_registered_ignores_projection_specific_redis()
    {
        LlmCompletionResponseCacheOptions llm = new()
        {
            Enabled = true,
            Provider = "Distributed",
            RedisConnectionString = "llm-redis:6379",
        };

        HotPathCacheOptions hotPath = new() { RedisConnectionString = "hotpath-redis:6379" };

        string resolved = ArchLucidDistributedCacheRegistrar.ResolveGraphProjectionRedisConnectionString(
            kgRedis: "projection-redis:6379",
            llm,
            hotPath,
            distributedCacheAlreadyRegistered: true);

        resolved.Should().Be("llm-redis:6379");
    }

    [Fact]
    public void ResolveGraphProjectionRedisConnectionString_when_registering_new_cache_prefers_projection_specific_redis()
    {
        LlmCompletionResponseCacheOptions llm = new()
        {
            Enabled = true,
            Provider = "Distributed",
            RedisConnectionString = "llm-redis:6379",
        };

        HotPathCacheOptions hotPath = new() { RedisConnectionString = "hotpath-redis:6379" };

        string resolved = ArchLucidDistributedCacheRegistrar.ResolveGraphProjectionRedisConnectionString(
            kgRedis: "projection-redis:6379",
            llm,
            hotPath,
            distributedCacheAlreadyRegistered: false);

        resolved.Should().Be("projection-redis:6379");
    }
}
