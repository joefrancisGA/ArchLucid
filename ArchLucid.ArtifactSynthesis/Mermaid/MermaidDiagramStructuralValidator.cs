namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramStructuralValidator : IMermaidDiagramStructuralValidator
{
    public bool TryValidate(string mermaid, out IReadOnlyList<string> errors)
    {
        List<string> validationErrors = [];

        if (string.IsNullOrWhiteSpace(mermaid))
        {
            validationErrors.Add("Mermaid output is empty.");
            errors = validationErrors;
            return false;
        }

        string[] lines = mermaid.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (lines.Length == 0 || !lines[0].StartsWith("flowchart", StringComparison.OrdinalIgnoreCase))
        {
            validationErrors.Add("Mermaid must begin with a flowchart directive.");
        }

        int openSubgraphs = 0;

        foreach (string line in lines.Skip(1))
        {
            if (line.StartsWith("subgraph ", StringComparison.Ordinal))
            {
                openSubgraphs++;

                continue;
            }

            if (string.Equals(line, "end", StringComparison.OrdinalIgnoreCase))
            {
                openSubgraphs--;

                if (openSubgraphs < 0)
                {
                    validationErrors.Add("Unbalanced subgraph end directive.");
                }

                continue;
            }

            if (line.Contains("-->", StringComparison.Ordinal))
            {
                continue;
            }

            if (line.Contains('[') && line.Contains(']'))
            {
                continue;
            }

            if (line.StartsWith("%%", StringComparison.Ordinal))
            {
                continue;
            }

            validationErrors.Add($"Unrecognized Mermaid line: {line}");
        }

        if (openSubgraphs != 0)
        {
            validationErrors.Add("Subgraph blocks are not balanced.");
        }

        errors = validationErrors;
        return validationErrors.Count == 0;
    }
}
