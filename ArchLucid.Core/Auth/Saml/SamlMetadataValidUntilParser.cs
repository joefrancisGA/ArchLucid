using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>Parses SAML metadata root <c>validUntil</c> without coupling to IdP vendor-specific deserialization.</summary>
public static class SamlMetadataValidUntilParser
{
    public static DateTimeOffset? TryExtractValidUntilUtc(string xml)
    {
        if (string.IsNullOrWhiteSpace(xml))
            return null;

        try
        {
            XDocument document = XDocument.Parse(xml, LoadOptions.None);
            XElement? root = document.Root;

            XAttribute? validUntilAttribute = root?.Attribute("validUntil");

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
}
