using ArchLucid.Core.Admin;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Scim;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Scim;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIdentityAuthScimIdentity(IServiceCollection services)
    {
        services.AddSingleton<IScimTenantTokenRepository, InMemoryScimTenantTokenRepository>();
        services.AddSingleton<IScimUserRepository, InMemoryScimUserRepository>();
        services.AddSingleton<IPlatformUserRepository, InMemoryPlatformUserRepository>();
        services.AddSingleton<IAuthenticationIdentityRepository, InMemoryAuthenticationIdentityRepository>();
        services.AddSingleton<IWorkspaceMembershipRepository, InMemoryWorkspaceMembershipRepository>();
        services.AddSingleton<IIdentityMigrationReviewRepository, InMemoryIdentityMigrationReviewRepository>();
        services.AddSingleton<ILegacyPlatformIdentityMigrationSource, InMemoryLegacyPlatformIdentityMigrationSource>();
        services.AddSingleton<IScimGroupRepository, InMemoryScimGroupRepository>();
        services.AddSingleton<IUserSettingsRepository, InMemoryUserSettingsRepository>();
        services.AddSingleton<IUserInvitationRepository, InMemoryUserInvitationRepository>();
        services.AddSingleton<ITenantTeamsIncomingWebhookConnectionRepository, InMemoryTenantTeamsIncomingWebhookConnectionRepository>();
        services.AddSingleton<ITenantAzureOpenAiConnectionRepository, InMemoryTenantAzureOpenAiConnectionRepository>();
        services.AddSingleton<ITenantIdentityProviderConfigurationRepository, InMemoryTenantIdentityProviderConfigurationRepository>();
        services.AddSingleton<ICustomRoleRepository, InMemoryCustomRoleRepository>();
    }
}
