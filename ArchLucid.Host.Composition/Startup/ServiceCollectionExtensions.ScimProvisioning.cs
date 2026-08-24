using ArchLucid.Application.Scim;
using ArchLucid.Application.Scim.RoleMapping;
using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterScimProvisioning(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<ScimOptions>(configuration.GetSection(ScimOptions.SectionName));
        services.AddSingleton<IGroupToRoleMapper, GroupToRoleMapper>();
        services.AddScoped<IScimTokenIssuer, ScimTokenIssuer>();
        services.AddScoped<IScimBearerTokenAuthenticator, ScimBearerTokenAuthenticator>();
        services.AddScoped<IScimUserService, ScimUserService>();
        services.AddScoped<IScimGroupService, ScimGroupService>();
        services.AddScoped<IRoleSyncService, RoleSyncService>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<ScimTokenRotationReminderJob>();
    }
}
