namespace ArchLucid.ContextIngestion.Diagram;

public static class DiagramSourceFormats
{
    public const string Mermaid = "mermaid";
    public const string Svg = "svg";
    public const string DrawIoXml = "drawio-xml";
    public const string Vsdx = "vsdx";
    public const string ArchLucidDiagramJson = "archlucid-diagram-json";
    public const string Png = "png";
    public const string Pdf = "pdf";

    public static bool IsMermaidFormat(string? format)
    {
        string normalized = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(format);

        return string.Equals(normalized, Mermaid, StringComparison.OrdinalIgnoreCase)
               || SupportedContextDocumentContentTypes.IsMermaidContentType(format);
    }

    public static bool IsSvgFormat(string? format)
    {
        string normalized = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(format);

        return string.Equals(normalized, Svg, StringComparison.OrdinalIgnoreCase)
               || SupportedContextDocumentContentTypes.IsStructuredDiagramSvgContentType(format);
    }

    public static bool IsDrawIoXmlFormat(string? format)
    {
        string normalized = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(format);

        return string.Equals(normalized, DrawIoXml, StringComparison.OrdinalIgnoreCase)
               || SupportedContextDocumentContentTypes.IsDrawIoXmlContentType(format);
    }

    public static bool IsVsdxFormat(string? format)
    {
        string normalized = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(format);

        return string.Equals(normalized, Vsdx, StringComparison.OrdinalIgnoreCase)
               || SupportedContextDocumentContentTypes.IsVisioVsdxContentType(format);
    }

    public static bool IsArchLucidDiagramJsonFormat(string? format)
    {
        string normalized = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(format);

        return string.Equals(normalized, ArchLucidDiagramJson, StringComparison.OrdinalIgnoreCase)
               || SupportedContextDocumentContentTypes.IsStructuredDiagramJsonContentType(format);
    }
}
