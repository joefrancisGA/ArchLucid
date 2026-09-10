using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;

namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>
///     Strips scriptable SVG constructs before structured diagram parse (AS-008). Never executes uploaded SVG as HTML.
/// </summary>
public static partial class SvgDiagramSanitizer
{
    private static readonly XmlReaderSettings SafeXmlReaderSettings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
        MaxCharactersInDocument = 2_000_000,
    };

    public static SvgDiagramSanitizeResult Sanitize(string? svgContent)
    {
        List<string> warnings = [];

        if (string.IsNullOrWhiteSpace(svgContent))
        {
            warnings.Add("SVG source was empty.");

            return new SvgDiagramSanitizeResult
            {
                SanitizedContent = string.Empty,
                Warnings = warnings,
            };
        }

        string normalized = svgContent.Trim();

        if (normalized.Length > 0 && normalized[0] == '\uFEFF')
        {
            normalized = normalized[1..];
        }

        try
        {
            using XmlReader reader = XmlReader.Create(
                new StringReader(normalized),
                SafeXmlReaderSettings);

            XDocument document = XDocument.Load(reader, LoadOptions.None);
            XElement? root = document.Root;

            if (root is null || !string.Equals(root.Name.LocalName, "svg", StringComparison.OrdinalIgnoreCase))
            {
                warnings.Add("SVG root element was missing or not an svg element.");

                return new SvgDiagramSanitizeResult
                {
                    SanitizedContent = string.Empty,
                    Warnings = warnings,
                };
            }

            RemoveUnsafeElements(root, warnings);
            StripUnsafeAttributes(root, warnings);

            return new SvgDiagramSanitizeResult
            {
                SanitizedContent = root.ToString(SaveOptions.DisableFormatting),
                Warnings = warnings,
            };
        }
        catch (XmlException ex)
        {
            warnings.Add($"SVG XML parse failed: {ex.Message}");

            return new SvgDiagramSanitizeResult
            {
                SanitizedContent = string.Empty,
                Warnings = warnings,
            };
        }
    }

    private static void RemoveUnsafeElements(XElement root, List<string> warnings)
    {
        foreach (XElement element in root.Descendants().ToList())
        {
            string localName = element.Name.LocalName;

            if (string.Equals(localName, "script", StringComparison.OrdinalIgnoreCase))
            {
                element.Remove();
                warnings.Add("Removed script element from SVG source.");

                continue;
            }

            if (string.Equals(localName, "foreignObject", StringComparison.OrdinalIgnoreCase))
            {
                element.Remove();
                warnings.Add("Removed foreignObject element from SVG source.");
            }
        }
    }

    private static void StripUnsafeAttributes(XElement root, List<string> warnings)
    {
        foreach (XElement element in root.DescendantsAndSelf())
        {
            foreach (XAttribute attribute in element.Attributes().ToList())
            {
                if (ShouldRemoveAttribute(attribute))
                {
                    attribute.Remove();
                    warnings.Add($"Removed unsafe SVG attribute '{attribute.Name.LocalName}'.");
                }
            }
        }
    }

    private static bool ShouldRemoveAttribute(XAttribute attribute)
    {
        string localName = attribute.Name.LocalName;

        if (localName.StartsWith("on", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.Equals(localName, "href", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(localName, "xlink:href", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string value = attribute.Value.Trim();

        return JavascriptUrlRegex().IsMatch(value) || ExternalHttpHrefRegex().IsMatch(value);
    }

    [GeneratedRegex(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex JavascriptUrlRegex();

    [GeneratedRegex(@"^\s*https?://", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ExternalHttpHrefRegex();
}
