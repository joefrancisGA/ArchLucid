using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Shared configured-status human-review mapping for inbound ITSM webhooks.</summary>
internal static class ItsmInboundHumanReviewMapHelper
{
    /// <summary>
    ///     Operator-provided keys win over defaults. Invalid enum spellings in config are ignored (treated as unmapped).
    /// </summary>
    public static bool TryConfiguredHumanReview(
        Dictionary<string, string> rawMap,
        string incomingKey,
        out string? humanReview,
        out bool matchedKeyWithInvalidValue)
    {
        humanReview = null;
        matchedKeyWithInvalidValue = false;

        if (rawMap.Count is 0)
            return false;

        foreach (KeyValuePair<string, string> kv in rawMap.Where(kv => !string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value)).Where(kv => string.Equals(kv.Key.Trim(), incomingKey, StringComparison.OrdinalIgnoreCase)))
        {
            if (!Enum.TryParse(kv.Value.Trim(), ignoreCase: true, out FindingHumanReviewStatus parsed))
            {
                matchedKeyWithInvalidValue = true;

                return false;
            }

            humanReview = parsed.ToString();

            return true;
        }

        return false;
    }
}
