using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class EvidenceValidationPipeline : IEvidenceValidationPipeline
{
    private readonly IArchitectureIntelligenceLlmGateway? _llmGateway;

    public EvidenceValidationPipeline()
        : this(llmGateway: null)
    {
    }

    public EvidenceValidationPipeline(IArchitectureIntelligenceLlmGateway? llmGateway)
    {
        _llmGateway = llmGateway;
    }

    public EvidenceValidationResult Validate(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion)
    {
        return BuildResult(
            findingId,
            citedArtifactIds,
            citedQuotes,
            sourceStore,
            claimedConclusion,
            llmSemanticAssessment: null);
    }

    public async Task<EvidenceValidationResult> ValidateAsync(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion,
        CancellationToken cancellationToken = default)
    {
        SemanticSupportAssessment? llmAssessment = null;

        if (_llmGateway is not null)
        {
            llmAssessment = await _llmGateway.AssessSemanticSupportAsync(
                claimedConclusion,
                citedQuotes,
                cancellationToken);
        }

        return BuildResult(
            findingId,
            citedArtifactIds,
            citedQuotes,
            sourceStore,
            claimedConclusion,
            llmAssessment);
    }

    private static EvidenceValidationResult BuildResult(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion,
        SemanticSupportAssessment? llmSemanticAssessment)
    {
        if (string.IsNullOrWhiteSpace(findingId))
        {
            throw new ArgumentException("FindingId is required.", nameof(findingId));
        }

        ArgumentNullException.ThrowIfNull(citedArtifactIds);
        ArgumentNullException.ThrowIfNull(citedQuotes);
        ArgumentNullException.ThrowIfNull(sourceStore);

        if (string.IsNullOrWhiteSpace(claimedConclusion))
        {
            throw new ArgumentException("ClaimedConclusion is required.", nameof(claimedConclusion));
        }

        bool integrityPassed = ValidateIntegrity(citedArtifactIds, citedQuotes, sourceStore);
        EvidenceValidationStageOutcome integrityStage = new()
        {
            Stage = EvidenceValidationStage.DeterministicIntegrity,
            Passed = integrityPassed,
            Detail = integrityPassed
                ? "All cited artifacts verified (exists, hash unchanged, cited text present when supplied)."
                : "One or more cited artifacts failed integrity verification, or no artifacts were cited.",
            IsDeterministic = true,
        };

        bool claimAlignmentPassed = EvaluateClaimAlignment(citedQuotes, claimedConclusion);
        EvidenceValidationStageOutcome claimAlignmentStage = new()
        {
            Stage = EvidenceValidationStage.ClaimAlignment,
            Passed = claimAlignmentPassed,
            Detail = claimAlignmentPassed
                ? "Cited quotes share meaningful tokens with the claimed conclusion."
                : "Cited quotes are empty or do not align with the claimed conclusion.",
            IsDeterministic = false,
        };

        SemanticSupportAssessment semanticAssessment = llmSemanticAssessment
            ?? AssessSemanticSupportHeuristic(integrityPassed, claimAlignmentPassed, citedQuotes, claimedConclusion);

        string semanticDetail = llmSemanticAssessment.HasValue
            ? $"Semantic support assessed as {semanticAssessment} via LLM (model reasoning; not deterministic)."
            : $"Semantic support assessed as {semanticAssessment} via heuristic fallback (model reasoning; not deterministic).";

        EvidenceValidationStageOutcome semanticStage = new()
        {
            Stage = EvidenceValidationStage.SemanticSupport,
            Passed = semanticAssessment is SemanticSupportAssessment.Supports
                or SemanticSupportAssessment.PartiallySupports,
            Detail = semanticDetail,
            IsDeterministic = false,
        };

        string? completenessNotes = null;
        bool completenessPassed = citedArtifactIds.Count >= 1 && integrityPassed;

        if (citedArtifactIds.Count < 2)
        {
            completenessNotes = "Fewer than two artifacts were cited; completeness may be limited.";
        }

        if (claimedConclusion.Contains("Indeterminate", StringComparison.OrdinalIgnoreCase)
            || claimedConclusion.Contains("Insufficient", StringComparison.OrdinalIgnoreCase))
        {
            completenessNotes = (completenessNotes ?? string.Empty)
                + " Conclusion is evidence-limited; additional sources may change the outcome.";
            completenessPassed = false;
        }

        EvidenceValidationStageOutcome completenessStage = new()
        {
            Stage = EvidenceValidationStage.Completeness,
            Passed = completenessPassed && citedArtifactIds.Count >= 2,
            Detail = completenessNotes ?? "At least two verified artifacts were cited.",
            IsDeterministic = false,
        };

        bool escalated = !integrityPassed
            || claimedConclusion.Contains("Critical", StringComparison.OrdinalIgnoreCase)
            || claimedConclusion.Contains(":High", StringComparison.OrdinalIgnoreCase)
            || semanticAssessment is SemanticSupportAssessment.Contradicts
                or SemanticSupportAssessment.DoesNotEstablish;

        EvidenceValidationStageOutcome escalationStage = new()
        {
            Stage = EvidenceValidationStage.Escalation,
            Passed = !escalated,
            Detail = escalated
                ? "Escalation required: integrity failure, high severity, or weak/contradictory semantic support."
                : "No escalation required.",
            IsDeterministic = false,
        };

        EvidenceValidationResult result = new()
        {
            FindingId = findingId,
            StageResults =
            [
                integrityStage,
                claimAlignmentStage,
                semanticStage,
                completenessStage,
                escalationStage,
            ],
            OverallPassedIntegrity = integrityPassed,
            SemanticAssessment = semanticAssessment,
            CompletenessNotes = completenessNotes,
            Escalated = escalated,
        };

        result.SupportTier = EvidenceSupportTierResolver.Resolve(result);

        return result;
    }

    private static bool ValidateIntegrity(
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore)
    {
        if (citedArtifactIds.Count == 0)
        {
            return false;
        }

        for (int index = 0; index < citedArtifactIds.Count; index++)
        {
            string artifactId = citedArtifactIds[index];
            string? expectedQuote = index < citedQuotes.Count ? citedQuotes[index] : null;

            if (!sourceStore.VerifyIntegrity(artifactId, string.IsNullOrWhiteSpace(expectedQuote) ? null : expectedQuote))
            {
                return false;
            }
        }

        return true;
    }

    private static bool EvaluateClaimAlignment(IReadOnlyList<string> citedQuotes, string claimedConclusion)
    {
        IReadOnlyList<string> nonEmptyQuotes = citedQuotes
            .Where(quote => !string.IsNullOrWhiteSpace(quote))
            .ToList();

        if (nonEmptyQuotes.Count == 0)
        {
            return false;
        }

        HashSet<string> claimTokens = Tokenize(claimedConclusion);

        if (claimTokens.Count == 0)
        {
            return true;
        }

        foreach (string quote in nonEmptyQuotes)
        {
            HashSet<string> quoteTokens = Tokenize(quote);
            int overlap = quoteTokens.Count(token => claimTokens.Contains(token));

            if (overlap >= 1)
            {
                return true;
            }
        }

        return false;
    }

    private static SemanticSupportAssessment AssessSemanticSupportHeuristic(
        bool integrityPassed,
        bool claimAlignmentPassed,
        IReadOnlyList<string> citedQuotes,
        string claimedConclusion)
    {
        if (!integrityPassed)
        {
            return SemanticSupportAssessment.DoesNotEstablish;
        }

        string? primaryQuote = citedQuotes.FirstOrDefault(quote => !string.IsNullOrWhiteSpace(quote));

        if (primaryQuote is null)
        {
            return SemanticSupportAssessment.DoesNotEstablish;
        }

        if (primaryQuote.Contains("contradict", StringComparison.OrdinalIgnoreCase)
            || claimedConclusion.Contains("Contradict", StringComparison.OrdinalIgnoreCase))
        {
            return SemanticSupportAssessment.Contradicts;
        }

        if (claimAlignmentPassed && primaryQuote.Length > 20)
        {
            return SemanticSupportAssessment.Supports;
        }

        if (claimAlignmentPassed || primaryQuote.Length > 10)
        {
            return SemanticSupportAssessment.PartiallySupports;
        }

        return SemanticSupportAssessment.DoesNotEstablish;
    }

    private static HashSet<string> Tokenize(string text)
    {
        char[] separators = [' ', '\t', '\r', '\n', '.', ',', ':', ';', '-', '_', '/', '\\', '(', ')', '[', ']', '"', '\''];

        return text
            .Split(separators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(token => token.Length >= 4)
            .Select(token => token.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
    }
}
