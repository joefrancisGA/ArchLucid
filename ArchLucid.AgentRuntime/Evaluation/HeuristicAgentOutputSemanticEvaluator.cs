using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Deterministic JSON inspection scoring claim evidence and finding completeness (no LLM).
/// </summary>
/// <inheritdoc cref="IHeuristicAgentOutputSemanticEvaluator" />
public sealed class HeuristicAgentOutputSemanticEvaluator : IHeuristicAgentOutputSemanticEvaluator
{
    private const int MinDescriptionLengthLegacy = 10;
    private const int MinRecommendationLengthLegacy = 5;

    private readonly AgentOutputQualityGateOptions _gateOptions;

    /// <summary>Tests / harnesses without DI wiring.</summary>
    public HeuristicAgentOutputSemanticEvaluator()
        : this(Options.Create(new AgentOutputQualityGateOptions()))
    {
    }

    public HeuristicAgentOutputSemanticEvaluator(IOptions<AgentOutputQualityGateOptions> gateOptions)
    {
        ArgumentNullException.ThrowIfNull(gateOptions);
        _gateOptions = gateOptions.Value;
    }

    private bool Tightened => _gateOptions.HeuristicEvaluatorTightenedThresholds;

    private int MinDescriptionLength => Tightened ? 60 : MinDescriptionLengthLegacy;

    private int MinRecommendationLength => Tightened ? 25 : MinRecommendationLengthLegacy;

    /// <inheritdoc />
    public AgentOutputSemanticScore Evaluate(string traceId, string? parsedResultJson, AgentType agentType)
    {
        ArgumentException.ThrowIfNullOrEmpty(traceId);

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return BuildZeroScore(traceId, agentType);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return BuildZeroScore(traceId, agentType);

            (double claimsRatio, int emptyClaims) = EvaluateClaims(doc.RootElement);
            (double findingsRatio, int incompleteFindings) = EvaluateFindings(doc.RootElement);

            double proposedSurfaceRatio = EvaluateProposedChangesSurfaceRatio(doc.RootElement);
            double overall = ComputeOverallScore(claimsRatio, findingsRatio, proposedSurfaceRatio, agentType, doc.RootElement);

            return new AgentOutputSemanticScore
            {
                TraceId = traceId,
                AgentType = agentType,
                ClaimsQualityRatio = claimsRatio,
                FindingsQualityRatio = findingsRatio,
                EmptyClaimCount = emptyClaims,
                IncompleteFindingCount = incompleteFindings,
                OverallSemanticScore = overall,
                HeuristicOverallScore = overall
            };
        }
        catch (JsonException)
        {
            return BuildZeroScore(traceId, agentType);
        }
    }

    private (double ratio, int emptyCount) EvaluateClaims(JsonElement root)
    {
        if (!root.TryGetProperty("claims", out JsonElement claimsElement) ||
            claimsElement.ValueKind != JsonValueKind.Array)
            return (0.0, 0);

        int total = 0;
        int withEvidence = 0;

        foreach (JsonElement claim in claimsElement.EnumerateArray())
        {
            total++;

            if (claim.ValueKind != JsonValueKind.Object)
                continue;

            bool hasEvidenceRefs = claim.TryGetProperty("evidenceRefs", out JsonElement refs)
                                   && refs.ValueKind == JsonValueKind.Array
                                   && refs.GetArrayLength() > 0;

            int refLen = hasEvidenceRefs ? refs.GetArrayLength() : 0;

            bool hasEvidenceString = claim.TryGetProperty("evidence", out JsonElement ev)
                                     && ev.ValueKind == JsonValueKind.String
                                     && (ev.GetString()?.Length ?? 0) > 0;

            bool backed;

            if (Tightened)

                backed = refLen >= 2 ||
                         (claim.TryGetProperty("evidence", out JsonElement ev2) &&
                          ev2.ValueKind == JsonValueKind.String &&
                          (ev2.GetString()?.Length ?? 0) >= 30);

            else

                backed = hasEvidenceRefs || hasEvidenceString;

            if (backed)

                withEvidence++;
        }

        return total == 0 ? (0.0, 0) : ((double)withEvidence / total, total - withEvidence);
    }

    private (double ratio, int incompleteCount) EvaluateFindings(JsonElement root)
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
                                  && (desc.GetString()?.Length ?? 0) > MinDescriptionLength;

            bool hasRecommendation = finding.TryGetProperty("recommendation", out JsonElement rec)
                                       && rec.ValueKind == JsonValueKind.String
                                       && (rec.GetString()?.Length ?? 0) > MinRecommendationLength;

            if (!hasSeverity || !hasDescription || !hasRecommendation)
                continue;

            string description = finding.GetProperty("description").GetString() ?? string.Empty;

            string recommendation = finding.GetProperty("recommendation").GetString() ?? string.Empty;

            double contribution = 1.0;

            if (Tightened && !ShareSignificantToken(description, recommendation))

                contribution = 0.5;

            weightedComplete += contribution;
        }

        int incompleteApprox = total == 0 ? 0 : (int)Math.Round(total - weightedComplete);

        return total == 0 ? (0.0, 0) : (weightedComplete / total, incompleteApprox);
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

    /// <summary>
    ///     Topology surfaces services/datastores/relationships in <c>proposedChanges</c>; score non-empty slices so
    ///     claim/finding-less topology rows are not forced to 0.
    /// </summary>
    private double EvaluateProposedChangesSurfaceRatio(JsonElement root)
    {
        if (!root.TryGetProperty("proposedChanges", out JsonElement pc) || pc.ValueKind != JsonValueKind.Object)
            return 0.0;

        int hits = 0;

        if (pc.TryGetProperty("addedServices", out JsonElement svc) && svc.ValueKind == JsonValueKind.Array &&
            svc.GetArrayLength() > 0)

            hits += Tightened ? CountWellFormedServices(svc) > 0 ? 1 : 0 : 1;

        if (pc.TryGetProperty("addedDatastores", out JsonElement ds) && ds.ValueKind == JsonValueKind.Array &&
            ds.GetArrayLength() > 0)

            hits += Tightened ? CountWellFormedDatastores(ds) > 0 ? 1 : 0 : 1;

        if (pc.TryGetProperty("addedRelationships", out JsonElement rel) && rel.ValueKind == JsonValueKind.Array &&
            rel.GetArrayLength() > 0)

            hits += Tightened ? CountWellFormedRelationships(rel) > 0 ? 1 : 0 : 1;

        return hits / 3.0;
    }

    private static int CountWellFormedServices(JsonElement array)
    {
        int n = 0;

        foreach (JsonElement item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)

                continue;

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

        foreach (JsonElement item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)

                continue;

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

        foreach (JsonElement item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)

                continue;

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

    private static double ComputeOverallScore(
        double claimsRatio,
        double findingsRatio,
        double proposedSurfaceRatio,
        AgentType agentType,
        JsonElement root)
    {
        bool hasClaims = root.TryGetProperty("claims", out JsonElement c)
                         && c.ValueKind == JsonValueKind.Array
                         && c.GetArrayLength() > 0;

        bool hasFindings = root.TryGetProperty("findings", out JsonElement f)
                           && f.ValueKind == JsonValueKind.Array
                           && f.GetArrayLength() > 0;

        bool topologyProposedOnly =
            agentType == AgentType.Topology && !hasClaims && !hasFindings && proposedSurfaceRatio > 0;

        if (!hasClaims && !hasFindings && !topologyProposedOnly)
            return 0.0;

        if (topologyProposedOnly)
            return proposedSurfaceRatio;

        if (hasClaims && !hasFindings)
            return claimsRatio;

        if (!hasClaims && hasFindings)
            return findingsRatio;

        (double claimsWeight, double findingsWeight) = SemanticWeights(agentType);

        return claimsRatio * claimsWeight + findingsRatio * findingsWeight;
    }

    private static (double ClaimsWeight, double FindingsWeight) SemanticWeights(AgentType agentType)
    {
        return agentType switch
        {
            AgentType.Compliance => (0.7, 0.3),
            AgentType.Topology => (0.4, 0.6),
            AgentType.Critic => (0.25, 0.75),
            AgentType.Cost => (0.55, 0.45),
            _ => throw new ArgumentOutOfRangeException(nameof(agentType), agentType, null)
        };
    }

    private static AgentOutputSemanticScore BuildZeroScore(string traceId, AgentType agentType)
    {
        return new AgentOutputSemanticScore
        {
            TraceId = traceId,
            AgentType = agentType,
            ClaimsQualityRatio = 0.0,
            FindingsQualityRatio = 0.0,
            EmptyClaimCount = 0,
            IncompleteFindingCount = 0,
            OverallSemanticScore = 0.0,
            HeuristicOverallScore = 0.0
        };
    }
}
