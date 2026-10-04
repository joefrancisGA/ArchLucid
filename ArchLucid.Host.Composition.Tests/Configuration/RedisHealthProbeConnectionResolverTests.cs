using FluentAssertions;

using ArchLucid.AgentRuntime;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class RedisHealthProbeConnectionResolverTests
{
    [Fact]
    public void Distributed_llm_cache_with_null_hot_path_redis_reports_configuration_error()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    [$"{LlmCompletionResponseCacheOptions.SectionName}:Enabled"] = "true",
                    [$"{LlmCompletionResponseCacheOptions.SectionName}:Provider"] = "Distributed",
                    [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = null,
                })
            .Build();

        ServiceCollection services = [];
        Action act = () =>
            ArchLucidDistributedCacheRegistrar.RegisterDistributedCacheForLlmCompletionIfNeeded(
                services,
                configuration);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void TryResolve_returns_null_when_no_redis_values_configured()
    {
        // Empty configuration binds defaulted option objects; all Redis slots are absent or blank.
        string? redis = RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build());

        redis.Should().BeNull();
    }

    [Fact]
    public void TryResolve_projection_string_wins_over_llm_and_hot_path_when_graph_cache_is_distributed()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Backend"] = "Distributed",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "projection",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                    })
                    .Build())
            .Should()
            .Be("projection");
    }

    [Fact]
    public void TryResolve_skips_orphan_projection_string_when_graph_cache_is_memory()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Enabled"] = "true",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Backend"] = "Memory",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "orphan-projection",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                    })
                    .Build())
            .Should()
            .Be("llm");
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
    public void TryResolve_graph_projection_distributed_redis_prefers_hot_path_when_hot_path_registers_shared_cache()
    {
        RedisHealthProbeConnectionResolver.TryResolveGraphProjectionDistributedRedisConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Enabled"] = "true",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Backend"] = "Distributed",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "projection",
                        [$"{HotPathCacheOptions.SectionName}:Enabled"] = "true",
                        [$"{HotPathCacheOptions.SectionName}:Provider"] = "Redis",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                    })
                    .Build())
            .Should()
            .Be("hot");
    }

    [Fact]
    public void TryResolve_graph_projection_distributed_redis_when_auto_promotes_on_multi_replica()
    {
        RedisHealthProbeConnectionResolver.TryResolveGraphProjectionDistributedRedisConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:Enabled"] = "true",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:CacheProvider"] = "Auto",
                        [$"{HotPathCacheOptions.SectionName}:ExpectedApiReplicaCount"] = "2",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                    })
                    .Build())
            .Should()
            .Be("hot");
    }

    [Fact]
    public void TryResolve_prefers_hot_path_redis_over_projection_when_hot_path_registers_shared_distributed_cache()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{HotPathCacheOptions.SectionName}:Enabled"] = "true",
                        [$"{HotPathCacheOptions.SectionName}:Provider"] = "Redis",
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = "hot",
                        [$"{KnowledgeGraphProjectionCacheOptions.SectionName}:RedisConnectionString"] = "projection",
                        [$"{LlmCompletionResponseCacheOptions.SectionName}:RedisConnectionString"] = "llm",
                    })
                    .Build())
            .Should()
            .Be("hot");
    }

    [Fact]
    public void TryResolve_returns_null_when_hot_path_redis_is_explicitly_null()
    {
        RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(
                new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = null,
                    })
                    .Build())
            .Should()
            .BeNull();
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
