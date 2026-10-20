using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     SAML-specific activation guards for persisted metadata XML.
/// </summary>
internal static class IdentityProviderActivationSamlMetadataGuards
{
    internal static void EnsureValidWhenProvided(TenantIdentityProtocol protocol, string? metadataXml)
    {
        if (protocol != TenantIdentityProtocol.Saml || metadataXml is null)
            return;

        try
        {
            SamlMetadataDiscoveryParser.Parse(metadataXml);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException or System.Xml.XmlException)
        {
            throw new ArgumentException("MetadataXml is not valid SAML metadata.", ex);
        }
    }
}
