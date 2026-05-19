using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Scim;
using ArchLucid.Api.Authentication;
using ArchLucid.Api.Configuration;
using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Services;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

public static class AuthServiceCollectionExtensions
{
    /// <summary>Well-known scheme name used when <c>ArchLucidAuth:Mode</c> is <c>ApiKey</c>.</summary>
    public const string ApiKeySchemeName = "ApiKey";

    public static IServiceCollection AddArchLucidAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // JwtBearer configuration via Options.Configure<IConfiguration> needs IConfiguration in DI; bare
        // ServiceCollections omit it. Hosts already register IConfiguration, so TryAdd does not replace production wiring.
        services.TryAddSingleton(configuration);

        services.Configure<ArchLucidAuthOptions>(configuration.GetSection(ArchLucidAuthOptions.SectionName));
        services.PostConfigure<ArchLucidAuthOptions>(
            ArchLucidAuthConfigurationBridge.NormalizeModeForJwtLocalSigning);
        services.Configure<ApiKeyAuthenticationOptions>(
            configuration.GetSection(ApiKeyAuthenticationOptions.SectionPath));

        ArchLucidAuthOptions authOptions = ArchLucidAuthConfigurationBridge.Resolve(configuration);

        services.Configure<ArchLucidSamlAuthOptions>(
            configuration.GetSection(ArchLucidSamlAuthOptions.ConfigurationSectionPath));

        // WebApplicationFactory / layered config: appsettings.Development.json sets DevelopmentBypass while CI hosts add
        // ArchLucidAuth:JwtSigningPublicKeyPemPath later. Branch on the raw PEM key too so JwtBearer is registered even
        // when the first Resolve snapshot still shows DevelopmentBypass, and re-Resolve IConfiguration when applying
        // JwtBearer options so PEM path and iss/aud are never stale.
        string pemPathFromConfiguration = configuration["ArchLucidAuth:JwtSigningPublicKeyPemPath"]?.Trim() ?? string.Empty;

        bool jwtByMode = string.Equals(authOptions.Mode, "JwtBearer", StringComparison.OrdinalIgnoreCase);

        // ArchLucidAuth:JwtSigningPublicKeyPemPath is an explicit CI / WebApplicationFactory bootstrap: nominate Jwt bearer
        // validation regardless of nominal Mode layering (defaults surface Mode=ApiKey in appsettings.json). Do not veto on
        // ApiKey here — Bearer minted against the PEM would otherwise hit the ApiKey scheme and return 401.
        bool jwtByLocalPem = pemPathFromConfiguration.Length > 0;

        if (jwtByMode || jwtByLocalPem)
        {
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer()
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

            // Last: JwtBearerConfigureOptions (framework) runs before ArchLucid so Authentication:Schemes:Bearer
            // cannot overwrite Authority/Audience bound from ArchLucidAuth.
            // Bind JwtBearer from the same IConfiguration snapshot used for jwtByLocalPem / jwtByMode above — not a separate
            // IConfiguration from DI, which WebApplicationFactory can populate later than AddArchLucidAuth (401 on valid PEM tokens).
            IConfiguration jwtBearerConfiguration = configuration;
            services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
                .Configure(options =>
                {
                    ArchLucidAuthOptions resolved = ArchLucidAuthConfigurationBridge.Resolve(jwtBearerConfiguration);
                    ArchLucidJwtBearerConfiguration.Apply(options, resolved, jwtBearerConfiguration);
                });
        }

        else if (string.Equals(authOptions.Mode, "ApiKey", StringComparison.OrdinalIgnoreCase))

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = ApiKeySchemeName;
                    options.DefaultChallengeScheme = ApiKeySchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                    ApiKeySchemeName,
                    _ =>
                    {
                    })
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

        else

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = DevelopmentBypassAuthenticationHandler.SchemeName;
                    options.DefaultChallengeScheme = DevelopmentBypassAuthenticationHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, DevelopmentBypassAuthenticationHandler>(
                    DevelopmentBypassAuthenticationHandler.SchemeName,
                    _ =>
                    {
                    })
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

        services.AddScoped<IRoleSyncService, NoOpRoleSyncService>();

        services.AddHttpContextAccessor();

        services.AddSingleton<IAuthDiagnosticsRingBuffer, AuthDiagnosticsRingBuffer>();
        services.AddScoped<IClaimsTransformation, ArchLucidRoleClaimsTransformation>();

        return services;
    }
}
