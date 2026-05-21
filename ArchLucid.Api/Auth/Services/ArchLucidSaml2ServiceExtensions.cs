using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Authentication;
using ArchLucid.Api.Configuration;

using ArchLucid.Core.Http;

using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.MvcCore.Configuration;
using ITfoxtec.Identity.Saml2.Schemas;
using ITfoxtec.Identity.Saml2.Schemas.Metadata;
using ITfoxtec.Identity.Saml2.Util;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Registers SAML 2.0 Service Provider services when <c>ArchLucidAuth:Saml2:Enabled</c> is true.</summary>
public static class ArchLucidSaml2ServiceExtensions
{
    /// <summary>
    ///     Binds <see cref="Saml2Configuration" /> from <see cref="ArchLucidSamlAuthOptions.ConfigurationSectionPath" />,
    ///     loads IdP metadata (HTTPS), and registers cookie-based SAML authentication. JWT / ApiKey / DevelopmentBypass
    ///     remains the default authenticate scheme for bearer-protected JSON APIs.
    /// </summary>
    public static IServiceCollection AddArchLucidSaml2IfEnabled(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        ArchLucidSamlAuthOptions samlOptions = configuration.GetSection(ArchLucidSamlAuthOptions.ConfigurationSectionPath)
            .Get<ArchLucidSamlAuthOptions>() ?? new ArchLucidSamlAuthOptions();

        if (!samlOptions.Enabled)
            return services;

        if (string.IsNullOrWhiteSpace(samlOptions.SigningCertificateFile))
            throw new InvalidOperationException(
                "ArchLucidAuth:Saml2:Enabled is true but SigningCertificateFile is empty. Provision an SP signing certificate (PFX).");

        if (string.IsNullOrWhiteSpace(samlOptions.IdPMetadata))
            throw new InvalidOperationException(
                "ArchLucidAuth:Saml2:Enabled is true but IdPMetadata URL is empty.");

        services.AddHttpClient(
            Options.DefaultName,
            static client =>
            {
                client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.InternalDiagnostics);
            });

        services.AddOptions<Saml2Configuration>()
            .Bind(configuration.GetSection(ArchLucidSamlAuthOptions.ConfigurationSectionPath))
            .PostConfigure<IHttpClientFactory>((saml2Configuration, httpClientFactory) =>
            {
                string trimmedCert = samlOptions.SigningCertificateFile.Trim();
                string certPath = Path.IsPathRooted(trimmedCert)
                    ? trimmedCert
                    : Path.GetFullPath(Path.Combine(environment.ContentRootPath, trimmedCert.TrimStart('/', '\\')));

                saml2Configuration.SigningCertificate =
                    CertificateUtil.Load(certPath, samlOptions.SigningCertificatePassword);
                saml2Configuration.AllowedAudienceUris.Add(saml2Configuration.Issuer);

                EntityDescriptor entityDescriptor = new();
                entityDescriptor
                    .ReadIdPSsoDescriptorFromUrlAsync(httpClientFactory, new Uri(samlOptions.IdPMetadata.Trim()))
                    .GetAwaiter()
                    .GetResult();

                ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity(saml2Configuration, entityDescriptor);
            });

        services.AddSaml2(slidingExpiration: true);

        services.PostConfigure<CookieAuthenticationOptions>(
            Saml2Constants.AuthenticationScheme,
            ArchLucidSaml2CookieSignInAuditIntegration.MergeSignedInHandler);

        ArchLucidAuthOptions archLucidAuthOptions = ArchLucidAuthConfigurationBridge.Resolve(configuration);
        string primaryApiScheme = ResolvePrimaryApiAuthenticationScheme(archLucidAuthOptions);
        services.AddSingleton<IPostConfigureOptions<AuthenticationOptions>>(
            new ArchLucidSaml2AuthenticationCoexistenceConfigurer(primaryApiScheme));

        return services;
    }

    /// <summary>Matches <see cref="AuthServiceCollectionExtensions.AddArchLucidAuth" /> default schemes for the active mode.</summary>
    private static string ResolvePrimaryApiAuthenticationScheme(ArchLucidAuthOptions authOptions)
    {
        ArgumentNullException.ThrowIfNull(authOptions);

        if (string.Equals(authOptions.Mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
            return JwtBearerDefaults.AuthenticationScheme;

        if (string.Equals(authOptions.Mode, "ApiKey", StringComparison.OrdinalIgnoreCase))
            return AuthServiceCollectionExtensions.ApiKeySchemeName;

        return DevelopmentBypassAuthenticationHandler.SchemeName;
    }
}

