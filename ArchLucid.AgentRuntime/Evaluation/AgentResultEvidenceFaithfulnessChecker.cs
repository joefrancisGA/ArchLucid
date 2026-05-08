using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentResultEvidenceFaithfulnessChecker"/>
/// <remarks>
///     Token rules mirror <see cref="ArchLucid.Decisioning.Findings.ExplanationFaithfulnessChecker"/> intent (>=4 chars,
///     stopword filter). This is a grounding heuristic, not legal-grade truth verification.
/// </remarks>
public sealed class AgentResultEvidenceFaithfulnessChecker : IAgentResultEvidenceFaithfulnessChecker
{
    private const int MinTokenLength = 4;
    private const int MaxUnsupportedListed = 32;

    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "that", "this", "with", "from", "have", "has", "had", "were", "been", "will", "would", "could", "should",
        "must", "may", "might", "not", "are", "was", "and", "for", "the", "but", "any", "all", "each", "both",
        "such", "than", "then", "them", "their", "there", "these", "those", "into", "also", "only", "just",
        "more", "most", "some", "very", "when", "what", "which", "while", "where", "who", "how", "why",
        "your", "our", "its", "can", "did", "does", "done", "being", "over", "under", "after", "before",
        "between", "through", "during", "about", "against", "within", "without", "using", "based", "including",
        "included", "related", "overall", "several", "another", "other", "same", "well", "high", "low"
    };

    /// <inheritdoc />
    public AgentResultEvidenceFaithfulnessReport Evaluate(string parsedResultJson, AgentEvidencePackage evidencePackage)
    {
        ArgumentNullException.ThrowIfNull(evidencePackage);

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return new AgentResultEvidenceFaithfulnessReport(0, 0, 0, 0, 1.0, []);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return new AgentResultEvidenceFaithfulnessReport(0, 0, 0, 0, 1.0, []);

            AgentEvidenceGroundingIndex.Index index = AgentEvidenceGroundingIndex.Build(evidencePackage);
            string fullBlob = index.FullBlob;

            int claimsChecked = 0;
            int claimsSupported = 0;
            int findingsChecked = 0;
            int findingsSupported = 0;
            List<string> unsupported = [];

            if (doc.RootElement.TryGetProperty("claims", out JsonElement claimsEl) &&
                claimsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement claim in claimsEl.EnumerateArray())
                {
                    claimsChecked++;

                    if (!AgentResultJsonEvidenceGrounding.TryDescribeClaim(claim, out string claimText, out List<string> refs))
                    {
                        PushUnsupported("claim:parse", unsupported);

                        continue;
                    }

                    string citedBlob = index.ResolveRefsBlob(refs);

                    if (refs.Count > 0 && string.IsNullOrEmpty(citedBlob))
                    {
                        PushUnsupported("claim:unresolved-ref", unsupported);

                        continue;
                    }

                    string blobForOverlap = string.IsNullOrEmpty(citedBlob) ? fullBlob : citedBlob;

                    if (HasTokenOverlap(claimText, blobForOverlap))

                        claimsSupported++;

                    else

                        PushUnsupported("claim:overlap", unsupported);
                }
            }

            if (doc.RootElement.TryGetProperty("findings", out JsonElement findingsEl) &&
                findingsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement finding in findingsEl.EnumerateArray())
                {
                    findingsChecked++;

                    if (!AgentResultJsonEvidenceGrounding.TryGetFindingTextParts(
                            finding,
                            out string category,
                            out string description,
                            out string recommendation))
                    {
                        PushUnsupported("finding:shape", unsupported);

                        continue;
                    }

                    bool categoryOk =
                        !string.IsNullOrWhiteSpace(category) &&
                        (fullBlob.Contains(category, StringComparison.OrdinalIgnoreCase) ||
                         Enum.TryParse(category, ignoreCase: true, out Contracts.Common.AgentType _));

                    bool textOk =
                        HasTokenOverlap(description, fullBlob) || HasTokenOverlap(recommendation, fullBlob);

                    if (categoryOk && textOk)

                        findingsSupported++;

                    else

                        PushUnsupported("finding:grounding", unsupported);
                }
            }

            int totalChecked = claimsChecked + findingsChecked;

            if (totalChecked == 0)
                return new AgentResultEvidenceFaithfulnessReport(0, 0, 0, 0, 1.0, unsupported);

            int totalSupported = claimsSupported + findingsSupported;
            double ratio = (double)totalSupported / totalChecked;

            return new AgentResultEvidenceFaithfulnessReport(
                claimsChecked,
                claimsSupported,
                findingsChecked,
                findingsSupported,
                ratio,
                unsupported);
        }
        catch (JsonException)
        {
            return new AgentResultEvidenceFaithfulnessReport(0, 0, 0, 0, 0.0, ["json:parse"]);
        }
    }

    private static void PushUnsupported(string id, List<string> unsupported)
    {
        if (unsupported.Count >= MaxUnsupportedListed)

            return;

        unsupported.Add(id);
    }

    private static bool HasTokenOverlap(string text, string blobLowercase)
    {
        if (string.IsNullOrWhiteSpace(text) || string.IsNullOrEmpty(blobLowercase))
            return false;

        foreach (string token in CollectTokens(text))
        {
            if (blobLowercase.Contains(token, StringComparison.Ordinal))

                return true;
        }

        return false;
    }

    private static List<string> CollectTokens(string blob)
    {
        List<string> list = [];
        HashSet<string> distinct = new(StringComparer.OrdinalIgnoreCase);
        ReadOnlySpan<char> span = blob.AsSpan();
        int i = 0;

        while (i < span.Length)
        {
            while (i < span.Length && !char.IsLetterOrDigit(span[i]))

                i++;

            int start = i;

            while (i < span.Length && (char.IsLetterOrDigit(span[i]) || span[i] == '-' || span[i] == '_'))

                i++;

            int len = i - start;

            if (len < MinTokenLength)
                continue;

            string token = span.Slice(start, len).ToString().ToLowerInvariant();

            if (Stopwords.Contains(token))
                continue;

            if (long.TryParse(token, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
                continue;

            if (distinct.Add(token))

                list.Add(token);
        }

        return list;
    }
}
