using ArchLucid.Core.Admin;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Diagnostics;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Tenancy;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIdentityAuthRecoveryAuth(IServiceCollection services)
    {
        services.AddSingleton<IEmailOtpChallengeRepository, InMemoryEmailOtpChallengeRepository>();
        services.AddSingleton<ISelfServiceTrialAbuseRepository, InMemorySelfServiceTrialAbuseRepository>();
        services.AddSingleton<ISchemaVersionsJournalReader, InMemorySchemaVersionsJournalReader>();
        services.AddSingleton<ITenantSignInEmailDomainRepository, InMemoryTenantSignInEmailDomainRepository>();
        services.AddSingleton<ITenantSignInEmailDomainRecoveryAdminRepository, InMemoryTenantSignInEmailDomainRecoveryAdminRepository>();
        services.AddSingleton<IPlatformTenantAuthRecoveryGrantRepository, InMemoryPlatformTenantAuthRecoveryGrantRepository>();
        services.AddSingleton<IAuthenticationIdentityLinkProposalRepository, InMemoryAuthenticationIdentityLinkProposalRepository>();
        services.AddSingleton<ITrialIdentityUserRepository, InMemoryNoTrialIdentityUserRepository>();
    }
}
