using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Persistence.Caching;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HotPathCacheRegistrationNullProviderTests
{
    [Fact]
    public void RegisterHotPathReadCaching_null_provider_does_not_throw_at_composition()
    {
        ServiceCollection services = [];
        services.AddLogging();

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["HotPathCache:Enabled"] = "true",
                    ["HotPathCache:Provider"] = null,
                })
            .Build();

        Action act = () => ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);

        act.Should().NotThrow();
        services.Should().Contain(static d => d.ServiceType == typeof(IHotPathReadCache));
        services.Should().NotContain(static d => d.ServiceType == typeof(Microsoft.Extensions.Caching.Distributed.IDistributedCache));
    }
}
