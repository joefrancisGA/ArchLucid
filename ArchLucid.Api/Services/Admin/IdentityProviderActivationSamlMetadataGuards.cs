using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     SAML-specific activation guards for persisted metadata XML.
/// </summary>
internal static class IdentityProviderActivationSamlMetadataGuards
{
    internal static void EnsurePresentWhenRequired(
        TenantIdentityProtocol protocol,
        string? resolvedMetadataXml,
        bool requiresSubstantiveMetadata)
    {
        if (protocol != TenantIdentityProtocol.Saml)
            return;

        if (!requiresSubstantiveMetadata)
            return;

        if (IdentityProviderSubstantiveTextValidation.HasSubstantiveText(resolvedMetadataXml))
            return;

        throw new ArgumentException("MetadataXml is required for SAML activation.");
    }

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
