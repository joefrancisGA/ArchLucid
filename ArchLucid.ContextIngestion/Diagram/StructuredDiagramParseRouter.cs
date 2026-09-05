using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class StructuredDiagramParseRouter
{
    private readonly IReadOnlyList<IDiagramSourceParser> parsers;

    public StructuredDiagramParseRouter(IEnumerable<IDiagramSourceParser> parsers)
    {
        this.parsers = parsers.ToList();
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        IDiagramSourceParser? parser = this.parsers.FirstOrDefault(candidate => candidate.CanParse(source.Format));

        if (parser is null)
        {
            return new DiagramParseResult
            {
                Warnings = [$"Unsupported diagram format '{source.Format}'."],
            };
        }

        try
        {
            return parser.Parse(source);
        }
        catch (Exception ex)
        {
            return new DiagramParseResult
            {
                Warnings = [$"Diagram parse failed for '{source.Name}': {ex.Message}"],
            };
        }
    }
}
