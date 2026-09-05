using System.Text.Json;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class ArchLucidDiagramJsonParser : IDiagramSourceParser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.ArchLucidDiagramJson, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        List<string> warnings = [];

        if (string.IsNullOrWhiteSpace(source.Content))
        {
            warnings.Add("ArchLucid diagram JSON was empty.");

            return new DiagramParseResult { Warnings = warnings };
        }

        try
        {
            ArchitectureDiagramModelRecord? model = JsonSerializer.Deserialize<ArchitectureDiagramModelRecord>(
                source.Content,
                JsonOptions);

            if (model is null)
            {
                warnings.Add("ArchLucid diagram JSON deserialized to null.");

                return new DiagramParseResult { Warnings = warnings };
            }

            return new DiagramParseResult { Model = model, Warnings = warnings };
        }
        catch (JsonException ex)
        {
            warnings.Add($"ArchLucid diagram JSON parse failed: {ex.Message}");

            return new DiagramParseResult { Warnings = warnings };
        }
    }
}
