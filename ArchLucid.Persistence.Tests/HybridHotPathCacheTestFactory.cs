using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Options;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests;

internal static class HybridHotPathCacheTestFactory
{
    public static HybridHotPathReadCache Create(HotPathCacheOptions options, bool addDistributedMemoryCache = false)
    {
        ServiceCollection services = new();

        services.AddLogging(static b =>
        {
            b.SetMinimumLevel(LogLevel.Warning);
        });

        services.AddSingleton<IOptionsMonitor<HotPathCacheOptions>>(new FixedOptionsMonitor<HotPathCacheOptions>(options));

        int seconds = options.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        TimeSpan ttl = TimeSpan.FromSeconds(seconds);

        services.AddHybridCache(o =>
        {
            o.MaximumPayloadBytes = 16 * 1024 * 1024;

            o.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = ttl,
                LocalCacheExpiration = ttl
            };
        });

        if (addDistributedMemoryCache)
            services.AddDistributedMemoryCache();

        services.AddSingleton<HybridHotPathReadCache>();

        ServiceProvider provider = services.BuildServiceProvider();

        return provider.GetRequiredService<HybridHotPathReadCache>();
    }
}
