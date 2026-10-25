namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Shared curated-evidence type guard for validator and LLM response normalization (TB-274).</summary>
internal static class ProposedEvidenceSupportedTypes
{
    public static bool IsSupported(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
            return false;

        string normalized = type.Trim();

        return normalized.Equals("Policy", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Pattern", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Service", StringComparison.OrdinalIgnoreCase);
    }
}
