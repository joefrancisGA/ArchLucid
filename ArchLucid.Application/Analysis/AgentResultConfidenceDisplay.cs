using System.Globalization;

namespace ArchLucid.Application.Analysis;

internal static class AgentResultConfidenceDisplay
{
    public static string Format(double? confidence, string missingLabel)
    {
        ArgumentNullException.ThrowIfNull(missingLabel);

        return confidence.HasValue
            ? confidence.Value.ToString("0.00", CultureInfo.InvariantCulture)
            : missingLabel;
    }
}
