using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class SvgDiagramSourceParser : IDiagramSourceParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.Svg, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        List<string> warnings =
        [
            "SVG structured parse does not extract components without vision ingest (IE-20).",
        ];

        return new DiagramParseResult
        {
            Model = new ArchitectureDiagramModelRecord(),
            Warnings = warnings,
        };
    }
}
