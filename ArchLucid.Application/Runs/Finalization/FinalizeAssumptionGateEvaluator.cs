using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Server-side finalize gate for existential assumptions (TB-2345 item 49).</summary>
public static class FinalizeAssumptionGateEvaluator
{
    private static readonly string[] ExistentialTokens =
    [
        "data class",
        "rto",
        "rpo",
        "trust boundary",
        "recovery",
        "pii",
        "phi",
        "regulated",
    ];

    public static IReadOnlyList<string> GetBlockingReasons(
        ArchitectureRequest request,
        FindingsSnapshot findings,
        IReadOnlySet<string>? acknowledgedAssumptionIds)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(findings);

        HashSet<string> acknowledgedIds = acknowledgedAssumptionIds is null
            ? new HashSet<string>(StringComparer.Ordinal)
            : new HashSet<string>(acknowledgedAssumptionIds, StringComparer.Ordinal);

        List<UnverifiedAssumption> assumptions = CollectOpenAssumptions(request, findings);
        int unacknowledgedExistentialCount = assumptions.Count(
            assumption => assumption.Existential && !acknowledgedIds.Contains(assumption.Id));

        if (unacknowledgedExistentialCount <= 0)
        {
            return Array.Empty<string>();
        }

        string noun = unacknowledgedExistentialCount == 1 ? "assumption" : "assumptions";

        return [
            $"{unacknowledgedExistentialCount} existential {noun} still need confirmation before finalize.",
        ];
    }

    internal static List<UnverifiedAssumption> CollectOpenAssumptions(
        ArchitectureRequest request,
        FindingsSnapshot findings)
    {
        List<string> mergedTexts = [];

        foreach (Finding finding in findings.Findings)
        {
            if (finding.IsMuted || IsFinalizeResolvedFinding(finding))
            {
                continue;
            }

            string? label = ReadAssumptionLabel(finding);

            if (label is not null)
            {
                mergedTexts.Add(label);
            }
        }

        foreach (string assumption in request.Assumptions)
        {
            if (!string.IsNullOrWhiteSpace(assumption))
            {
                mergedTexts.Add(assumption.Trim());
            }
        }

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<UnverifiedAssumption> results = [];

        foreach (string text in mergedTexts)
        {
            string trimmed = text.Trim();

            if (trimmed.Length == 0 || seen.Contains(trimmed))
            {
                continue;
            }

            seen.Add(trimmed);
            string lower = trimmed.ToLowerInvariant();
            bool existential = ExistentialTokens.Any(token => lower.Contains(token, StringComparison.Ordinal));

            results.Add(new UnverifiedAssumption(
                StableAssumptionIdFromText(trimmed),
                trimmed,
                existential));
        }

        return results;
    }

    private static bool IsFinalizeResolvedFinding(Finding finding)
    {
        return finding.HumanReviewStatus is FindingHumanReviewStatus.Approved
            or FindingHumanReviewStatus.Overridden;
    }

    private static string? ReadAssumptionLabel(Finding finding)
    {
        string combined = $"{finding.Title}\n{finding.Rationale}";

        if (!combined.Contains("assumption", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(finding.Title))
        {
            return finding.Title.Trim();
        }

        if (!string.IsNullOrWhiteSpace(finding.Rationale))
        {
            return finding.Rationale.Trim();
        }

        return null;
    }

    internal static string StableAssumptionIdFromText(string text)
    {
        string normalized = text.Trim().ToLowerInvariant();
        uint hash = 2166136261;

        foreach (char character in normalized)
        {
            hash ^= character;
            hash *= 16777619;
        }

        return $"assumption-{ToBase36(hash)}";
    }

    private static string ToBase36(uint value)
    {
        const string digits = "0123456789abcdefghijklmnopqrstuvwxyz";

        if (value == 0)
        {
            return "0";
        }

        Span<char> buffer = stackalloc char[13];
        int position = buffer.Length;

        while (value > 0)
        {
            buffer[--position] = digits[(int)(value % 36)];
            value /= 36;
        }

        return new string(buffer[position..]);
    }

    internal readonly record struct UnverifiedAssumption(string Id, string Text, bool Existential);
}
