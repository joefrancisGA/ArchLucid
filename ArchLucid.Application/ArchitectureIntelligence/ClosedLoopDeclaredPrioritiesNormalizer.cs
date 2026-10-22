using System.Text;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopDeclaredPrioritiesNormalizer
{
    public static List<string> Normalize(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => NormalizeUnicode(priority.Trim()))
            .GroupBy(priority => priority, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.OrderBy(priority => priority, StringComparer.Ordinal).First())
            .ToList();
    }

    private static string NormalizeUnicode(string value) =>
        value.Length == 0 ? value : value.Normalize(NormalizationForm.FormC);
}
