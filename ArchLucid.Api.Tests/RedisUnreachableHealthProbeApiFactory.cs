using System.Net;
using System.Net.Sockets;

using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     API-key auth (<see cref="HealthEndpointSecurityApiFactory"/> parity) plus a non-listening Redis loopback endpoint.
/// </summary>
public sealed class RedisUnreachableHealthProbeApiFactory : ArchLucidApiFactory
{
    private static readonly Dictionary<string, string?> ApiKeyAuthConfiguration =
        new()
        {
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
            ["Authentication:ApiKey:AdminKey"] = HealthEndpointSecurityApiFactory.IntegrationTestAdminApiKey,
        };

    private static readonly string UnreachableRedisConnectionString =
        AllocateThenReleaseUnreachableRedisLoopbackEndpoint();

    private static readonly Dictionary<string, string?> CombinedConfiguration = Merge(
        ApiKeyAuthConfiguration,
        new Dictionary<string, string?>
        {
            [$"{HotPathCacheOptions.SectionName}:RedisConnectionString"] = UnreachableRedisConnectionString,
        });

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        IConfiguration bootstrap =
            new ConfigurationBuilder().AddInMemoryCollection(CombinedConfiguration).Build();

        builder.UseConfiguration(bootstrap);
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(CombinedConfiguration);
        });
    }

    private static Dictionary<string, string?> Merge(
        Dictionary<string, string?> first,
        Dictionary<string, string?> second)
    {
        Dictionary<string, string?> merged = [];

        foreach (KeyValuePair<string, string?> entry in first)
            merged[entry.Key] = entry.Value;

        foreach (KeyValuePair<string, string?> entry in second)
            merged[entry.Key] = entry.Value;

        return merged;
    }

    private static string AllocateThenReleaseUnreachableRedisLoopbackEndpoint()
    {
        TcpListener listener = new(IPAddress.Loopback, port: 0);

        listener.Start();

        int port = ((IPEndPoint)listener.LocalEndpoint).Port;

        listener.Stop();

        return $"{IPAddress.Loopback}:{port},abortConnect=false,connectTimeout=600,syncTimeout=600";
    }
}
