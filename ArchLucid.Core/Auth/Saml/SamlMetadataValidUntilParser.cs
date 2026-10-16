using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>Parses SAML metadata root <c>validUntil</c> without coupling to IdP vendor-specific deserialization.</summary>
public static class SamlMetadataValidUntilParser
{
    private static readonly XNamespace SamlMetadataNs = "urn:oasis:names:tc:SAML:2.0:metadata";

    public static DateTimeOffset? TryExtractValidUntilUtc(string xml)
    {
        if (string.IsNullOrWhiteSpace(xml))
            return null;

        try
        {
            XDocument document = XDocument.Parse(xml, LoadOptions.None);
            XElement? root = document.Root;

            XAttribute? validUntilAttribute = ResolveValidUntilAttribute(root);

            if (validUntilAttribute is null || string.IsNullOrWhiteSpace(validUntilAttribute.Value))
                return null;

            if (DateTimeOffset.TryParse(
                    validUntilAttribute.Value,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                    out DateTimeOffset dto))
                return dto;

            return null;
        }
        catch (System.Xml.XmlException)
        {
            return null;
        }
    }

    private static XAttribute? ResolveValidUntilAttribute(XElement? root)
    {
        if (root is null)
            return null;

        XAttribute? rootAttribute = root.Attribute("validUntil");

        if (rootAttribute is not null && !string.IsNullOrWhiteSpace(rootAttribute.Value))
            return rootAttribute;

        // Federation exports often use EntitiesDescriptor without a root validUntil while the sole nested
        // EntityDescriptor carries the signing-metadata expiry operators expect diagnostics to honor.
        XName entityName = SamlMetadataNs + "EntityDescriptor";

        if (root.Name == entityName)
            return null;

        List<XElement> entities = root.Descendants(entityName).ToList();

        if (entities.Count != 1)
            return null;

        return entities[0].Attribute("validUntil");
    }
}
