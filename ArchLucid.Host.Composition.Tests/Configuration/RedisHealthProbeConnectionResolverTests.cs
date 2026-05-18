using FluentAssertions;

using ArchLucid.AgentRuntime;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.Tests.Configuration;

public sealed class RedisHealthProbeConnectionResolverTests
{
    [Fact]
    public void TryResolve_returns_null_when_no_redis_values_configured()
    {
        // Empty configuration binds defaulted option objects; all Redis slots are absent or blank.
        string? redis = RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build());

        redis.Should().BeNull();
    }

    [Fact]
    public void TryResolve_projection_string_wins_over_llm_and_hot_path()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "projection",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                    })
                    .Build())
            .Should()
            .Be("projection");
    }

    [Fact]
    public void TryResolve_falls_through_to_llm_then_hot_path()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                    })
                    .Build())
            .Should()
            .Be("llm");

        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                    })
                    .Build())
            .Should()
            .Be("hot");
    }

    [Fact]
    public void TryResolve_returns_null_when_only_whitespace()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "\t",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "   ",
                    })
                    .Build())
            .Should()
            .BeNull();
    }
}
