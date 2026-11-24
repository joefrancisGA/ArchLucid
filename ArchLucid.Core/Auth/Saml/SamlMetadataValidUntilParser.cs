using System.Globalization;
using System.Xml;
using System.Xml.Linq;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>Parses the earliest applicable SAML metadata expiry, distinguishing missing from invalid evidence.</summary>
public static class SamlMetadataValidUntilParser
{
    private static readonly XNamespace SamlMetadataNs = "urn:oasis:names:tc:SAML:2.0:metadata";

    /// <summary>Compatibility helper; use TryReadValidUntilUtc when missing and invalid must be distinguished.</summary>
    public static DateTimeOffset? TryExtractValidUntilUtc(string xml) =>
        TryReadValidUntilUtc(xml, out DateTimeOffset? expiry) ? expiry : null;

    /// <summary>
    /// Returns true for a recognized metadata document with valid expiry attributes (including absent expiry).
    /// Returns false for malformed XML, non-metadata roots or any invalid expiry attribute.
    /// </summary>
    public static bool TryReadValidUntilUtc(string xml, out DateTimeOffset? validUntilUtc)
    {
        validUntilUtc = null;
        if (string.IsNullOrWhiteSpace(xml))
            return false;

        try
        {
            XElement? root = XDocument.Parse(xml, LoadOptions.None).Root;
            XName entityName = SamlMetadataNs + "EntityDescriptor";
            XName containerName = SamlMetadataNs + "EntitiesDescriptor";

            if (root is null || (root.Name != entityName && root.Name != containerName))
                return false;

            DateTimeOffset? earliest = null;
            foreach (XElement descriptor in root.DescendantsAndSelf()
                         .Where(element => element.Name == entityName || element.Name == containerName))
            {
                XAttribute? attribute = descriptor.Attribute("validUntil");
                if (attribute is null)
                    continue;

                if (string.IsNullOrWhiteSpace(attribute.Value)
                    || !DateTimeOffset.TryParse(attribute.Value, CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out DateTimeOffset expiry))
                    return false;

                if (earliest is null || expiry < earliest)
                    earliest = expiry;
            }

            validUntilUtc = earliest;
            return true;
        }
        catch (XmlException)
        {
            return false;
        }
    }
}
