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

        XName entityName = SamlMetadataNs + "EntityDescriptor";

        if (root.Name == entityName)
            return TrySelectEarliestValidUntilAttribute(root.Attribute("validUntil"));

        // Federation exports may carry validUntil on the container, on nested EntityDescriptor nodes, or both.
        // Operational diagnostics should honor the earliest expiry so any stale entity fails closed.
        XAttribute? earliestAttribute = null;
        DateTimeOffset? earliestInstant = null;

        ConsiderValidUntilCandidate(root.Attribute("validUntil"), ref earliestAttribute, ref earliestInstant);

        foreach (XElement entity in root.Descendants(entityName))
        {
            ConsiderValidUntilCandidate(entity.Attribute("validUntil"), ref earliestAttribute, ref earliestInstant);
        }

        return earliestAttribute;
    }

    private static XAttribute? TrySelectEarliestValidUntilAttribute(XAttribute? attribute)
    {
        if (attribute is null || string.IsNullOrWhiteSpace(attribute.Value))
            return null;

        if (!DateTimeOffset.TryParse(
                attribute.Value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out _))
            return null;

        return attribute;
    }

    private static void ConsiderValidUntilCandidate(
        XAttribute? attribute,
        ref XAttribute? earliestAttribute,
        ref DateTimeOffset? earliestInstant)
    {
        if (attribute is null || string.IsNullOrWhiteSpace(attribute.Value))
            return;

        if (!DateTimeOffset.TryParse(
                attribute.Value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out DateTimeOffset instant))
        {
            return;
        }

        if (earliestInstant is null || instant < earliestInstant)
        {
            earliestInstant = instant;
            earliestAttribute = attribute;
        }
    }
}
