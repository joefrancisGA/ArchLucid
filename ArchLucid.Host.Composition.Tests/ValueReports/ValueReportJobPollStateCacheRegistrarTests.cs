using ArchLucid.Host.Composition.ValueReports;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.ValueReports;

[Trait("Category", "Unit")]
public sealed class ValueReportJobPollStateCacheRegistrarTests
{
    [Fact]
    public void Register_is_idempotent_when_poll_state_cache_already_registered()
    {
        ServiceCollection services = [];
        services.AddSingleton<IValueReportJobPollStateCache>(ProcessSharedValueReportJobPollStateCache.Instance);

        IConfiguration configuration = new ConfigurationBuilder().Build();

        ValueReportJobPollStateCacheRegistrar.Register(services, configuration);
        ValueReportJobPollStateCacheRegistrar.Register(services, configuration);

        services.Count(static d => d.ServiceType == typeof(IValueReportJobPollStateCache))
            .Should()
            .Be(1);
    }

    [Fact]
    public void Register_wraps_existing_IDistributedCache_instead_of_opening_separate_redis()
    {
        ServiceCollection services = [];
        services.AddDistributedMemoryCache();

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["HotPathCache:RedisConnectionString"] = "unused-health-probe-redis:6379",
            })
            .Build();

        ValueReportJobPollStateCacheRegistrar.Register(services, configuration);

        using ServiceProvider provider = services.BuildServiceProvider();
        IValueReportJobPollStateCache pollStateCache =
            provider.GetRequiredService<IValueReportJobPollStateCache>();

        pollStateCache.Should().BeOfType<DistributedCacheValueReportJobPollStateCache>();

        string key = "value-report-poll-state-registrar-test";
        byte[] payload = "payload"u8.ToArray();
        pollStateCache.Set(key, payload, new DistributedCacheEntryOptions());

        IDistributedCache sharedDistributedCache = provider.GetRequiredService<IDistributedCache>();
        sharedDistributedCache.Get(key).Should().Equal(payload);
    }

    [Fact]
    public void Register_falls_back_to_process_shared_cache_when_no_distributed_cache_or_redis()
    {
        ServiceCollection services = [];
        IConfiguration configuration = new ConfigurationBuilder().Build();
        services.AddSingleton(configuration);

        ValueReportJobPollStateCacheRegistrar.Register(services, configuration);

        using ServiceProvider provider = services.BuildServiceProvider();

        provider.GetRequiredService<IValueReportJobPollStateCache>()
            .Should()
            .BeSameAs(ProcessSharedValueReportJobPollStateCache.Instance);
    }
}
