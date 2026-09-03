using System.Globalization;
using System.Text.Json;

namespace ArchLucid.AgentRuntime.Evaluation;

internal sealed class HeuristicAgentOutputTraceQualityStage
{
    private readonly bool _tightened;

    private readonly int _minDescriptionLength;

    private readonly int _minRecommendationLength;

    public HeuristicAgentOutputTraceQualityStage(bool tightened, int minDescriptionLength, int minRecommendationLength)
    {
        _tightened = tightened;
        _minDescriptionLength = minDescriptionLength;
        _minRecommendationLength = minRecommendationLength;
    }

    public (double ratio, int incompleteCount) EvaluateFindings(JsonElement root)
    {
        if (!root.TryGetProperty("findings", out JsonElement findingsElement) ||
            findingsElement.ValueKind != JsonValueKind.Array)
            return (0.0, 0);

        int total = 0;
        double weightedComplete = 0;

        foreach (JsonElement finding in findingsElement.EnumerateArray())
        {
            total++;

            if (finding.ValueKind != JsonValueKind.Object)
                continue;

            bool hasSeverity = finding.TryGetProperty("severity", out JsonElement sev)
                               && sev.ValueKind == JsonValueKind.String
                               && (sev.GetString()?.Length ?? 0) > 0;

            bool hasDescription = finding.TryGetProperty("description", out JsonElement desc)
                                  && desc.ValueKind == JsonValueKind.String
                                  && (desc.GetString()?.Length ?? 0) > _minDescriptionLength;

            bool hasRecommendation = finding.TryGetProperty("recommendation", out JsonElement rec)
                                       && rec.ValueKind == JsonValueKind.String
                                       && (rec.GetString()?.Length ?? 0) > _minRecommendationLength;

            if (!hasSeverity || !hasDescription || !hasRecommendation)
                continue;

            string description = finding.GetProperty("description").GetString() ?? string.Empty;

            string recommendation = finding.GetProperty("recommendation").GetString() ?? string.Empty;

            double contribution = 1.0;

            if (_tightened && !ShareSignificantToken(description, recommendation))

                contribution = 0.5;

            weightedComplete += contribution;
        }

        int incompleteApprox = total == 0 ? 0 : (int)Math.Round(total - weightedComplete);

        return total == 0 ? (0.0, 0) : (weightedComplete / total, incompleteApprox);
    }

    /// <summary>
    ///     Topology surfaces services/datastores/relationships in <c>proposedChanges</c>; score non-empty slices so
    ///     claim/finding-less topology rows are not forced to 0.
    /// </summary>
    public double EvaluateProposedChangesSurfaceRatio(JsonElement root)
    {
        if (!root.TryGetProperty("proposedChanges", out JsonElement pc) || pc.ValueKind != JsonValueKind.Object)
            return 0.0;

        int hits = 0;

        if (pc.TryGetProperty("addedServices", out JsonElement svc) && svc.ValueKind == JsonValueKind.Array &&
            svc.GetArrayLength() > 0)

            hits += _tightened ? CountWellFormedServices(svc) > 0 ? 1 : 0 : 1;

        if (pc.TryGetProperty("addedDatastores", out JsonElement ds) && ds.ValueKind == JsonValueKind.Array &&
            ds.GetArrayLength() > 0)

            hits += _tightened ? CountWellFormedDatastores(ds) > 0 ? 1 : 0 : 1;

        if (pc.TryGetProperty("addedRelationships", out JsonElement rel) && rel.ValueKind == JsonValueKind.Array &&
            rel.GetArrayLength() > 0)

            hits += _tightened ? CountWellFormedRelationships(rel) > 0 ? 1 : 0 : 1;

        return hits / 3.0;
    }

    private static bool ShareSignificantToken(string a, string b)
    {
        HashSet<string> da = CollectSignificantTokens(a);
        HashSet<string> db = CollectSignificantTokens(b);

        foreach (string t in da)

            if (db.Contains(t))

                return true;

        return false;
    }

    private static HashSet<string> CollectSignificantTokens(string text)
    {
        HashSet<string> set = new(StringComparer.OrdinalIgnoreCase);
        ReadOnlySpan<char> span = text.AsSpan();
        int i = 0;

        while (i < span.Length)
        {
            while (i < span.Length && !char.IsLetterOrDigit(span[i]))

                i++;

            int start = i;

            while (i < span.Length && (char.IsLetterOrDigit(span[i]) || span[i] == '-' || span[i] == '_'))

                i++;

            int len = i - start;

            if (len < 4)
                continue;

            string token = span.Slice(start, len).ToString().ToLowerInvariant();

            if (long.TryParse(token, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
                continue;

            _ = set.Add(token);
        }

        return set;
    }

    private static int CountWellFormedServices(JsonElement array)
    {
        int n = 0;

        foreach (JsonElement item in array.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object))
        {
            if (item.TryGetProperty("serviceName", out JsonElement name) &&
                name.ValueKind == JsonValueKind.String &&
                !string.IsNullOrWhiteSpace(name.GetString()))

                n++;
        }

        return n;
    }

    private static int CountWellFormedDatastores(JsonElement array)
    {
        int n = 0;

        foreach (JsonElement item in array.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object))
        {
            if (item.TryGetProperty("datastoreName", out JsonElement name) &&
                name.ValueKind == JsonValueKind.String &&
                !string.IsNullOrWhiteSpace(name.GetString()))

                n++;
        }

        return n;
    }

    private static int CountWellFormedRelationships(JsonElement array)
    {
        int n = 0;

        foreach (JsonElement item in array.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object))
        {
            bool src = item.TryGetProperty("sourceId", out JsonElement s) &&
                       s.ValueKind == JsonValueKind.String &&
                       !string.IsNullOrWhiteSpace(s.GetString());

            bool tgt = item.TryGetProperty("targetId", out JsonElement t) &&
                       t.ValueKind == JsonValueKind.String &&
                       !string.IsNullOrWhiteSpace(t.GetString());

            if (src && tgt)
                n++;
        }

        return n;
    }
}
