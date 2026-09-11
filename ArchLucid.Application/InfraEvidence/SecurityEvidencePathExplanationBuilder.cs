using System.Text.Json;

using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Deterministic simulator templates and LLM prompts for SA-17 path explanations.</summary>
public static class SecurityEvidencePathExplanationBuilder
{
    public const string SimulatorLabel = "SIMULATOR";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    public static SecurityEvidencePathExplanationContent BuildSimulatorExplanation(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        IReadOnlyList<string> citedEvidenceRefs)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);
        ArgumentNullException.ThrowIfNull(cutPoints);
        ArgumentNullException.ThrowIfNull(citedEvidenceRefs);

        SecurityEvidencePathProposedRemediation proposedRemediation = BuildProposedRemediation(path, hops, cutPoints);
        string executiveSummary =
            $"[{SimulatorLabel}] {path.PathKind} path ({path.PathConfidenceBand}) with {hops.Count} hop(s). "
            + $"Weakest link: hop {path.WeakestHopOrdinal} — {path.WeakestHopReason}. "
            + $"Cited evidence: {string.Join(", ", citedEvidenceRefs)}.";

        IReadOnlyList<string> hypotheses =
        [
            "AiInference hypothesis: privileged access on this path may expand blast radius to dependent workloads cited on the hops.",
            "AiInference hypothesis: business impact depends on crown-jewel classification — treat consequence as unknown until HumanAssertion is recorded.",
        ];

        return new SecurityEvidencePathExplanationContent
        {
            ExecutiveSummary = executiveSummary,
            BusinessImpactHypotheses = hypotheses,
            ProposedRemediation = proposedRemediation,
            CitedEvidenceRefs = citedEvidenceRefs,
        };
    }

    public static string BuildLlmUserPrompt(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        SecurityEvidencePathExplanationTemplateResponse explanationTemplate,
        IReadOnlyList<string> allowedEvidenceRefs)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);
        ArgumentNullException.ThrowIfNull(cutPoints);
        ArgumentNullException.ThrowIfNull(explanationTemplate);
        ArgumentNullException.ThrowIfNull(allowedEvidenceRefs);

        SecurityEvidencePathProposedRemediation proposedRemediation = BuildProposedRemediation(path, hops, cutPoints);

        var payload = new
        {
            pathId = path.PathId,
            pathKind = path.PathKind.ToString(),
            pathConfidenceBand = path.PathConfidenceBand.ToString(),
            weakestHopOrdinal = path.WeakestHopOrdinal,
            weakestHopReason = path.WeakestHopReason,
            allowedEvidenceRefs,
            explanationTemplate,
            hops = hops.Select(hop => new
            {
                hop.HopOrdinal,
                fromNodeLabel = SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(hop.FromNodeId),
                toNodeLabel = SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(hop.ToNodeId),
                edgeType = hop.EdgeType,
                provenanceKind = hop.ProvenanceKind.ToString(),
                hopConfidenceBand = hop.HopConfidenceBand.ToString(),
                hop.EvidenceReference,
            }),
            proposedRemediationSeed = proposedRemediation,
        };

        return "Structured SecureNow architect path JSON:\n" + JsonSerializer.Serialize(payload, JsonOptions);
    }

    public static bool TryParseLlmResponse(
        string llmJson,
        IReadOnlyCollection<string> allowedEvidenceRefs,
        IReadOnlyCollection<string> allowedArmIds,
        out SecurityEvidencePathExplanationContent content,
        out string? rejectionReason)
    {
        content = new SecurityEvidencePathExplanationContent();
        rejectionReason = null;

        try
        {
            SecurityEvidencePathExplanationLlmResponse? parsed =
                JsonSerializer.Deserialize<SecurityEvidencePathExplanationLlmResponse>(llmJson, JsonOptions);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.ExecutiveSummary))
            {
                rejectionReason = "LLM response was empty or missing executiveSummary.";
                return false;
            }

            string executiveSummary = parsed.ExecutiveSummary.Trim();

            if (!SecurityEvidencePathExplanationValidator.TrySanitizeArmReferences(
                    executiveSummary,
                    allowedArmIds,
                    out executiveSummary,
                    out IReadOnlyList<string> removedFromSummary))
            {
                rejectionReason = $"Executive summary introduced uncited ARM ids: {string.Join(", ", removedFromSummary)}.";
                return false;
            }

            List<string> hypotheses = [];

            foreach (string hypothesis in parsed.BusinessImpactHypotheses)
            {
                if (string.IsNullOrWhiteSpace(hypothesis))
                    continue;

                if (!SecurityEvidencePathExplanationValidator.TrySanitizeArmReferences(
                        hypothesis,
                        allowedArmIds,
                        out string sanitizedHypothesis,
                        out IReadOnlyList<string> removedFromHypothesis))
                {
                    rejectionReason = $"Business impact hypothesis introduced uncited ARM ids: {string.Join(", ", removedFromHypothesis)}.";
                    return false;
                }

                hypotheses.Add(sanitizedHypothesis.Trim());
            }

            SecurityEvidencePathProposedRemediation proposedRemediation = new()
            {
                RecommendedChange = parsed.ProposedRemediation?.RecommendedChange?.Trim()
                    ?? string.Empty,
                RecommendedChangeSource = parsed.ProposedRemediation?.RecommendedChangeSource?.Trim()
                    ?? RemediationPathNarrativeRecommendedChangeSources.WeakestHop,
                VerificationQueries = parsed.ProposedRemediation?.VerificationQueries?
                    .Where(static query => !string.IsNullOrWhiteSpace(query))
                    .Select(static query => query.Trim())
                    .ToList()
                    ?? [],
                Preconditions = parsed.ProposedRemediation?.Preconditions?
                    .Where(static item => !string.IsNullOrWhiteSpace(item))
                    .Select(static item => item.Trim())
                    .ToList()
                    ?? [],
                SuggestedPatternKey = parsed.ProposedRemediation?.SuggestedPatternKey?.Trim(),
            };

            if (!SecurityEvidencePathExplanationValidator.TrySanitizeArmReferences(
                    proposedRemediation.RecommendedChange,
                    allowedArmIds,
                    out string sanitizedRecommendedChange,
                    out IReadOnlyList<string> removedFromRemediation))
            {
                rejectionReason = $"Proposed remediation introduced uncited ARM ids: {string.Join(", ", removedFromRemediation)}.";
                return false;
            }

            proposedRemediation = new SecurityEvidencePathProposedRemediation
            {
                RecommendedChange = sanitizedRecommendedChange,
                RecommendedChangeSource = proposedRemediation.RecommendedChangeSource,
                VerificationQueries = proposedRemediation.VerificationQueries,
                Preconditions = proposedRemediation.Preconditions,
                SuggestedPatternKey = proposedRemediation.SuggestedPatternKey,
            };

            IReadOnlyList<string> citedEvidenceRefs = SecurityEvidencePathExplanationValidator.FilterCitedEvidenceRefs(
                parsed.CitedEvidenceRefs,
                allowedEvidenceRefs);

            content = new SecurityEvidencePathExplanationContent
            {
                ExecutiveSummary = executiveSummary,
                BusinessImpactHypotheses = hypotheses,
                ProposedRemediation = proposedRemediation,
                CitedEvidenceRefs = citedEvidenceRefs,
            };

            return true;
        }
        catch (JsonException ex)
        {
            rejectionReason = ex.Message;
            return false;
        }
    }

    public static SecurityEvidencePathProposedRemediation BuildProposedRemediation(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);
        ArgumentNullException.ThrowIfNull(cutPoints);

        SecurityEvidenceCutPointRecord? primaryCutPoint = cutPoints
            .OrderBy(static item => item.CutOrder)
            .FirstOrDefault();

        string canonicalHopHashHex = Convert.ToHexStringLower(path.CanonicalHopHashSha256);

        if (primaryCutPoint is not null)
        {
            SecurityEvidenceCutPointSummaryResponse cutPointSummary =
                SecurityEvidenceCutPointResponseMapper.MapSummary(primaryCutPoint);

            return new SecurityEvidencePathProposedRemediation
            {
                RecommendedChange = cutPointSummary.ExplanationSummary,
                RecommendedChangeSource = RemediationPathNarrativeRecommendedChangeSources.CutPoint,
                VerificationQueries =
                [
                    $"path:hash-absent={canonicalHopHashHex}",
                    $"cut-point:{primaryCutPoint.CutPointId:D}",
                ],
                Preconditions =
                [
                    "Validate blast radius with platform owners before applying the cut-point change.",
                ],
                SuggestedPatternKey = primaryCutPoint.SuggestedPatternKey,
            };
        }

        SecurityEvidencePathHopRecord? weakestHop = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal);
        string weakestHopHashHex = Convert.ToHexStringLower(path.CanonicalHopHashSha256);

        return new SecurityEvidencePathProposedRemediation
        {
            RecommendedChange = path.WeakestHopReason,
            RecommendedChangeSource = RemediationPathNarrativeRecommendedChangeSources.WeakestHop,
            VerificationQueries =
            [
                $"path:hash-absent={weakestHopHashHex}",
                weakestHop is null
                    ? $"weakest-hop:{path.WeakestHopOrdinal}"
                    : $"hop:{weakestHop.HopOrdinal}:{weakestHop.EdgeType}",
            ],
            Preconditions =
            [
                "Confirm the weakest hop remains the limiting control after any remediation draft.",
            ],
        };
    }

    public static SecurityEvidencePathExplanationResponse MapResponse(SecurityEvidencePathExplanationRecord record) =>
        new()
        {
            ExplanationId = record.ExplanationId,
            PathId = record.PathId,
            ExecutiveSummary = record.ExecutiveSummary,
            BusinessImpactHypotheses = record.BusinessImpactHypotheses,
            ProposedRemediation = new SecurityEvidencePathProposedRemediationResponse
            {
                RecommendedChange = record.ProposedRemediation.RecommendedChange,
                RecommendedChangeSource = record.ProposedRemediation.RecommendedChangeSource,
                VerificationQueries = record.ProposedRemediation.VerificationQueries,
                Preconditions = record.ProposedRemediation.Preconditions,
                SuggestedPatternKey = record.ProposedRemediation.SuggestedPatternKey,
            },
            CitedEvidenceRefs = record.CitedEvidenceRefs,
            ProvenanceKind = record.ProvenanceKind.ToString(),
            SimulatorLabel = record.SimulatorLabel,
            CreatedUtc = record.CreatedUtc,
        };

    private sealed class SecurityEvidencePathExplanationLlmResponse
    {
        public string ExecutiveSummary
        {
            get;
            set;
        } = string.Empty;

        public List<string> BusinessImpactHypotheses
        {
            get;
            set;
        } = [];

        public SecurityEvidencePathProposedRemediation? ProposedRemediation
        {
            get;
            set;
        }

        public List<string> CitedEvidenceRefs
        {
            get;
            set;
        } = [];
    }
}

public sealed class SecurityEvidencePathExplanationContent
{
    public string ExecutiveSummary
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> BusinessImpactHypotheses
    {
        get;
        init;
    } = [];

    public SecurityEvidencePathProposedRemediation ProposedRemediation
    {
        get;
        init;
    } = new();

    public IReadOnlyList<string> CitedEvidenceRefs
    {
        get;
        init;
    } = [];
}
