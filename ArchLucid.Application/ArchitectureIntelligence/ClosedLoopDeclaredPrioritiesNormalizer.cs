namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopDeclaredPrioritiesNormalizer
{
    public static List<string> Normalize(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => priority.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(priority => priority, StringComparer.Ordinal)
            .ToList();
    }
}
