using System.Linq;
using System.Security.Cryptography.X509Certificates;

using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.Schemas.Metadata;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Maps a resolved SAML 2.0 <see cref="EntityDescriptor" /> (IdP metadata) onto <see cref="Saml2Configuration" />.</summary>
internal static class ArchLucidSaml2IdpMetadataBinder
{
    private const string HttpRedirectBinding = "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect";
    /// <summary>
    ///     Applies IdP SSO descriptor fields from metadata to the active SAML configuration (issuer, endpoints,
    ///     signature validation certificates, AuthnRequest signing requirement).
    /// </summary>
    /// <exception cref="InvalidOperationException">Metadata lacks an IdP SSO descriptor or valid signing certificates.</exception>
    internal static void ApplyResolvedEntity(Saml2Configuration saml2Configuration, EntityDescriptor entityDescriptor)
    {
        ArgumentNullException.ThrowIfNull(saml2Configuration);
        ArgumentNullException.ThrowIfNull(entityDescriptor);

        IdPSsoDescriptor? idp = entityDescriptor.IdPSsoDescriptor;

        if (idp is null)
            throw new InvalidOperationException(
                "SAML IdP metadata did not contain an IdPSSODescriptor; check ArchLucidAuth:Saml2:IdPMetadata.");

        saml2Configuration.AllowedIssuer = entityDescriptor.EntityId;
        saml2Configuration.SingleSignOnDestination = SelectSingleSignOnDestination(idp.SingleSignOnServices);

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
    }

    private static Uri SelectSingleSignOnDestination(IEnumerable<SingleSignOnService> singleSignOnServices)
    {
        List<SingleSignOnService> candidates = singleSignOnServices
            .Where(endpoint => endpoint.Location is not null)
            .OrderByDescending(endpoint => endpoint.Location.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(endpoint => IsHttpRedirectBinding(endpoint.Binding))
            .ToList();

        if (candidates.Count == 0)
            throw new InvalidOperationException(
                "SAML IdP metadata did not contain a usable SingleSignOnService Location; check ArchLucidAuth:Saml2:IdPMetadata.");

        return candidates[0].Location;
    }

    private static bool IsHttpRedirectBinding(Uri? binding) =>
        binding is not null
        && string.Equals(binding.AbsoluteUri, HttpRedirectBinding, StringComparison.Ordinal);
}
