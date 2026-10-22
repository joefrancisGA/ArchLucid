namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Mode-aware filtering for snapshot completeness warnings shown in the workbench strip (IDX-11).</summary>
public static class InfraEvidenceMermaidCompletenessModeFilter
{
    public static List<string> FilterMissingWarnings(string modeKey, IReadOnlyList<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(modeKey);
        ArgumentNullException.ThrowIfNull(warnings);

        bool identityMode = string.Equals(modeKey, "identity", StringComparison.OrdinalIgnoreCase);

        return warnings
            .Where(warning => warning.Contains("missing", StringComparison.OrdinalIgnoreCase))
            .Where(warning =>
            {
                if (!identityMode)
                {
                    return true;
                }

                return !warning.Contains("nic", StringComparison.OrdinalIgnoreCase)
                       && !warning.Contains("subnet", StringComparison.OrdinalIgnoreCase);
            })
            .ToList();
    }
}
