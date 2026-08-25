using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Scim;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Scim;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for platform identity, SCIM, workspace membership, and auth recovery repositories.
/// </summary>
internal static class SqlIdentityRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IScimTenantTokenRepository, DapperScimTenantTokenRepository>();
        services.AddScoped<IPlatformUserRepository, DapperPlatformUserRepository>();
        services.AddScoped<IAuthenticationIdentityRepository, DapperAuthenticationIdentityRepository>();
        services.AddScoped<IWorkspaceMembershipRepository, DapperWorkspaceMembershipRepository>();
        services.AddScoped<IIdentityMigrationReviewRepository, DapperIdentityMigrationReviewRepository>();
        services.AddScoped<ILegacyPlatformIdentityMigrationSource, SqlLegacyPlatformIdentityMigrationSource>();
        services.AddScoped<IEmailOtpChallengeRepository, DapperEmailOtpChallengeRepository>();
        services.AddScoped<ISelfServiceTrialAbuseRepository, DapperSelfServiceTrialAbuseRepository>();
        services.AddScoped<ITenantSignInEmailDomainRecoveryAdminRepository, DapperTenantSignInEmailDomainRecoveryAdminRepository>();
        services.AddScoped<IPlatformTenantAuthRecoveryGrantRepository, DapperPlatformTenantAuthRecoveryGrantRepository>();
        services.AddScoped<IAuthenticationIdentityLinkProposalRepository, DapperAuthenticationIdentityLinkProposalRepository>();
        services.AddScoped<IScimGroupRepository, DapperScimGroupRepository>();
        services.AddScoped<IUserSettingsRepository, DapperUserSettingsRepository>();
        services.AddScoped<IUserInvitationRepository, DapperUserInvitationRepository>();
        services.AddScoped<ITrialIdentityUserRepository, SqlTrialIdentityUserRepository>();
    }
}
