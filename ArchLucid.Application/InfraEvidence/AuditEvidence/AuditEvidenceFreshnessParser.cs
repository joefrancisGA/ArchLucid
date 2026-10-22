using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static partial class AuditEvidenceFreshnessParser
{
    public const int DefaultFreshDays = 90;

    [GeneratedRegex(@"(\d+)", RegexOptions.CultureInvariant)]
    private static partial Regex DigitCapture();

    public static AuditEvidenceFreshnessPolicy Parse(string? requiredFreshness)
    {
        if (string.IsNullOrWhiteSpace(requiredFreshness))
        {
            return new AuditEvidenceFreshnessPolicy
            {
                FreshDays = DefaultFreshDays,
                StaleDays = DefaultFreshDays,
                ExpireDays = DefaultFreshDays * 2,
                IsParseable = false,
            };
        }

        string normalized = requiredFreshness.Trim();

        if (normalized.StartsWith("P", StringComparison.OrdinalIgnoreCase)
            && normalized.Length > 1
            && TryParseIsoDurationDays(normalized, out int isoDays))
        {
            return BuildPolicy(isoDays, isParseable: true);
        }

        Match match = DigitCapture().Match(normalized);

        if (!match.Success || !int.TryParse(match.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int days) || days <= 0)
        {
            return new AuditEvidenceFreshnessPolicy
            {
                FreshDays = DefaultFreshDays,
                StaleDays = DefaultFreshDays,
                ExpireDays = DefaultFreshDays * 2,
                IsParseable = false,
            };
        }

        return BuildPolicy(days, isParseable: true);
    }

    private static AuditEvidenceFreshnessPolicy BuildPolicy(int freshDays, bool isParseable) =>
        new()
        {
            FreshDays = freshDays,
            StaleDays = freshDays,
            ExpireDays = freshDays * 2,
            IsParseable = isParseable,
        };

    private static bool TryParseIsoDurationDays(string value, out int days)
    {
        days = 0;

        if (!value.EndsWith("D", StringComparison.OrdinalIgnoreCase))
            return false;

        string daySegment = value[1..^1];

        return int.TryParse(daySegment, NumberStyles.Integer, CultureInfo.InvariantCulture, out days) && days > 0;
    }
}
