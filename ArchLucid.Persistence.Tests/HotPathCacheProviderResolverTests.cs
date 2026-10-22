namespace ArchLucid.Persistence.Tests;
[Trait("Category", "Unit")]

public sealed class HotPathCacheProviderResolverTests
{
    [Fact]
    public void ResolveEffectiveProvider_null_or_whitespace_provider_falls_back_to_memory()
    {
        HotPathCacheProviderResolver.ResolveEffectiveProvider(new HotPathCacheOptions { Provider = null! })
            .Should().Be("Memory");
        HotPathCacheProviderResolver.ResolveEffectiveProvider(new HotPathCacheOptions { Provider = "   " })
            .Should().Be("Memory");
    }

    [Theory]
    [InlineData("Memory", 1, "", "Memory")]
    [InlineData("Redis", 1, "localhost:6379", "Redis")]
    [InlineData("Auto", 1, "", "Memory")]
    [InlineData("Auto", 1, "localhost:6379", "Memory")]
    [InlineData("Auto", 2, "", "Memory")]
    [InlineData("Auto", 2, "localhost:6379", "Redis")]
    public void ResolveEffectiveProvider_returns_expected(string provider, int replicas, string redis, string expected)
    {
        HotPathCacheOptions options = new()
        {
            Provider = provider,
            ExpectedApiReplicaCount = replicas,
            RedisConnectionString = redis
        };

        HotPathCacheProviderResolver.ResolveEffectiveProvider(options).Should().Be(expected);
    }
}
