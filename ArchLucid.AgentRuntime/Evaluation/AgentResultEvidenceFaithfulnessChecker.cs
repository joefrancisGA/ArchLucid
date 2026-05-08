using System.Globalization;
using System.Text;
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
        "included", "related", "overall", "several", "another", "other", "same", "well", "high", "low",
        "risk", "cost", "security", "compliance", "system", "design", "architecture", "manifest", "decision",
        "finding", "findings", "issue", "issues", "need", "needs", "recommend", "summary"
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

            EvidenceIndex index = EvidenceIndex.Build(evidencePackage);
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

                    if (!TryDescribeClaim(claim, out string claimText, out List<string> refs))
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

                    if (finding.ValueKind != JsonValueKind.Object)
                    {
                        PushUnsupported("finding:shape", unsupported);

                        continue;
                    }

                    string category =
                        finding.TryGetProperty("category", out JsonElement cat) && cat.ValueKind == JsonValueKind.String
                            ? cat.GetString() ?? string.Empty
                            : string.Empty;

                    string description =
                        finding.TryGetProperty("description", out JsonElement d) && d.ValueKind == JsonValueKind.String
                            ? d.GetString() ?? string.Empty
                            : string.Empty;

                    string recommendation =
                        finding.TryGetProperty("recommendation", out JsonElement r) && r.ValueKind == JsonValueKind.String
                            ? r.GetString() ?? string.Empty
                            : string.Empty;

                    bool categoryOk =
                        !string.IsNullOrWhiteSpace(category) &&
                        (fullBlob.Contains(category, StringComparison.OrdinalIgnoreCase) ||
                         Enum.TryParse(category, ignoreCase: true, out ArchLucid.Contracts.Common.AgentType _));

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

    private static bool TryDescribeClaim(JsonElement claim, out string claimText, out List<string> refs)
    {
        claimText = string.Empty;
        refs = [];

        switch (claim.ValueKind)
        {
            case JsonValueKind.String:
                claimText = claim.GetString() ?? string.Empty;

                return !string.IsNullOrWhiteSpace(claimText);

            case JsonValueKind.Object:
                foreach (string prop in new[] { "detail", "text", "evidence", "statement", "claim" })
                {
                    if (!claim.TryGetProperty(prop, out JsonElement p) || p.ValueKind != JsonValueKind.String)

                        continue;

                    string? s = p.GetString();

                    if (!string.IsNullOrWhiteSpace(s))
                        claimText = string.IsNullOrEmpty(claimText) ? s! : $"{claimText} {s}";
                }

                if (claim.TryGetProperty("evidenceRefs", out JsonElement r) && r.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement id in r.EnumerateArray())
                    {
                        if (id.ValueKind == JsonValueKind.String)
                        {
                            string? s = id.GetString();

                            if (!string.IsNullOrWhiteSpace(s))
                                refs.Add(s.Trim());
                        }
                    }
                }

                return !string.IsNullOrWhiteSpace(claimText) || refs.Count > 0;

            default:
                return false;
        }
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

    private sealed class EvidenceIndex
    {
        private EvidenceIndex(string fullBlob, Dictionary<string, string> refBlobById)
        {
            FullBlob = fullBlob;
            RefBlobById = refBlobById;
        }

        public string FullBlob
        {
            get;
        }

        private Dictionary<string, string> RefBlobById
        {
            get;
        }

        public static EvidenceIndex Build(AgentEvidencePackage evidence)
        {
            Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);
            StringBuilder sb = new();

            static void Append(StringBuilder b, string? s)
            {
                if (string.IsNullOrWhiteSpace(s))

                    return;

                b.Append(' ');
                b.Append(s);
            }

            Append(sb, evidence.SystemName);
            Append(sb, evidence.Environment);
            Append(sb, evidence.CloudProvider);
            Append(sb, evidence.Request?.Description);

            foreach (string c in evidence.Request?.Constraints ?? [])
                Append(sb, c);

            foreach (PolicyEvidence p in evidence.Policies)
            {
                Append(sb, p.PolicyId);
                Append(sb, p.Title);
                Append(sb, p.Summary);

                foreach (string c in p.RequiredControls)

                    Append(sb, c);

                string blob = $"{p.PolicyId} {p.Title} {p.Summary}".ToLowerInvariant();
                map[p.PolicyId] = blob;
            }

            foreach (ServiceCatalogEvidence s in evidence.ServiceCatalog)
            {
                Append(sb, s.ServiceId);
                Append(sb, s.ServiceName);
                Append(sb, s.Category);
                Append(sb, s.Summary);

                foreach (string t in s.Tags)

                    Append(sb, t);

                string blob =
                    $"{s.ServiceId} {s.ServiceName} {s.Category} {s.Summary}".ToLowerInvariant();
                map[s.ServiceId] = blob;
            }

            foreach (PatternEvidence p in evidence.Patterns)
            {
                Append(sb, p.PatternId);
                Append(sb, p.Name);
                Append(sb, p.Summary);

                foreach (string svc in p.SuggestedServices)

                    Append(sb, svc);

                map[p.PatternId] = $"{p.PatternId} {p.Name} {p.Summary}".ToLowerInvariant();
            }

            if (evidence.PriorManifest is { } prior)
            {
                Append(sb, prior.ManifestVersion);
                Append(sb, prior.Summary);

                foreach (string svc in prior.ExistingServices)

                    Append(sb, svc);

                foreach (string ds in prior.ExistingDatastores)

                    Append(sb, ds);

                foreach (string c in prior.ExistingRequiredControls)

                    Append(sb, c);
            }

            foreach (EvidenceNote note in evidence.Notes)

                Append(sb, note.Message);

            string full = sb.ToString().ToLowerInvariant();

            return new EvidenceIndex(full, map);
        }

        public string ResolveRefsBlob(IReadOnlyList<string> refs)
        {
            if (refs.Count == 0)
                return string.Empty;

            StringBuilder sb = new();

            foreach (string r in refs)
            {
                if (RefBlobById.TryGetValue(r, out string? blob))

                    _ = sb.Append(blob).Append(' ');
            }

            return sb.ToString().Trim();
        }
    }
}
