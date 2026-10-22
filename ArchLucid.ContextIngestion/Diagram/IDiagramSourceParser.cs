using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public interface IDiagramSourceParser
{
    bool CanParse(string format);

    DiagramParseResult Parse(DiagramSourceReference source);
}
