using ArchLucid.Host.Composition.Configuration;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.ValueReports;

internal static class ValueReportJobPollStateCacheRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        if (services.Any(static d => d.ServiceType == typeof(IValueReportJobPollStateCache)))
            return;

        services.AddSingleton<IValueReportJobPollStateCache>(static sp =>
        {
            IDistributedCache? distributedCache = sp.GetService<IDistributedCache>();

            if (distributedCache is not null)
                return new DistributedCacheValueReportJobPollStateCache(distributedCache);

            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string? redis = RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(config);

            if (!string.IsNullOrEmpty(redis))
            {
                RedisCache redisCache = new(new RedisCacheOptions { Configuration = redis });

                return new DistributedCacheValueReportJobPollStateCache(redisCache);
            }

            return ProcessSharedValueReportJobPollStateCache.Instance;
        });
    }
}
