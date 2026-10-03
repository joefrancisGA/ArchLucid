using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TransactionalEmailRegistrationTests
{
    [Fact]
    public void RegisterTransactionalEmailServices_null_provider_configuration_falls_back_to_noop()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Email:Provider"] = null
            })
            .Build();
        ServiceCollection services = new();

        ArchLucidStorageServiceCollectionExtensions.RegisterTransactionalEmailServices(
            services,
            configuration,
            new ArchLucidOptions { StorageProvider = "InMemory" });

        using ServiceProvider provider = services.BuildServiceProvider();

        IEmailProvider emailProvider = provider.GetRequiredService<IEmailProvider>();

        emailProvider.ProviderName.Should().Be(EmailProviderNames.Noop);
    }
}
