namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopDeclaredPrioritiesNormalizer
{
    public static List<string> Normalize(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => priority.Trim())
            .GroupBy(priority => priority, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.OrderBy(priority => priority, StringComparer.Ordinal).First())
            .ToList();
    }
}
