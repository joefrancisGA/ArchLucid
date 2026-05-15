using System.Linq;
using System.Security.Cryptography.X509Certificates;

using ArchLucid.Api.Auth.Models;

using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.MvcCore.Configuration;
using ITfoxtec.Identity.Saml2.Schemas.Metadata;
using ITfoxtec.Identity.Saml2.Util;

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

        services.AddHttpClient();

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

                IdPSsoDescriptor? idp = entityDescriptor.IdPSsoDescriptor;
                if (idp is null)
                    throw new InvalidOperationException(
                        "SAML IdP metadata did not contain an IdPSSODescriptor; check ArchLucidAuth:Saml2:IdPMetadata.");

                saml2Configuration.AllowedIssuer = entityDescriptor.EntityId;
                saml2Configuration.SingleSignOnDestination = idp.SingleSignOnServices.First().Location;

                if (idp.SingleLogoutServices.Any())
                    saml2Configuration.SingleLogoutDestination = idp.SingleLogoutServices.First().Location;

                foreach (X509Certificate2 signingCertificate in idp.SigningCertificates)
                {
                    if (signingCertificate.IsValidLocalTime())
                        saml2Configuration.SignatureValidationCertificates.Add(signingCertificate);
                }

                if (saml2Configuration.SignatureValidationCertificates.Count <= 0)
                    throw new InvalidOperationException(
                        "The IdP signing certificates from metadata are missing or expired; refresh IdP metadata or clocks.");

                if (idp.WantAuthnRequestsSigned is true)
                    saml2Configuration.SignAuthnRequest = true;
            });

        services.AddSaml2(slidingExpiration: true);

        return services;
    }
}
