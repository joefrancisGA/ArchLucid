using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIdentityAuth(IServiceCollection services)
    {
        RegisterIdentityAuthScimIdentity(services);
        RegisterIdentityAuthRecoveryAuth(services);
        RegisterIdentityAuthDigestPrefs(services);
    }
}
