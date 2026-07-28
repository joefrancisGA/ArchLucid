using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class EvidenceValidationPipeline : IEvidenceValidationPipeline
{
    public EvidenceValidationResult Validate(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion)
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
            Detail = integrityPassed ? "All cited artifacts verified." : "One or more cited artifacts failed integrity verification.",
            IsDeterministic = true,
        };

        bool claimAlignmentPassed = citedQuotes.Any(quote => !string.IsNullOrWhiteSpace(quote));
        EvidenceValidationStageOutcome claimAlignmentStage = new()
        {
            Stage = EvidenceValidationStage.ClaimAlignment,
            Passed = claimAlignmentPassed,
            Detail = claimAlignmentPassed ? "At least one non-empty quote was provided." : "No non-empty quote was provided.",
            IsDeterministic = false,
        };

        string? primaryQuote = citedQuotes.FirstOrDefault(quote => !string.IsNullOrWhiteSpace(quote));
        SemanticSupportAssessment semanticAssessment = primaryQuote is not null && primaryQuote.Length > 20
            ? SemanticSupportAssessment.Supports
            : SemanticSupportAssessment.PartiallySupports;

        EvidenceValidationStageOutcome semanticStage = new()
        {
            Stage = EvidenceValidationStage.SemanticSupport,
            Passed = semanticAssessment == SemanticSupportAssessment.Supports,
            Detail = $"Semantic support assessed as {semanticAssessment}.",
            IsDeterministic = false,
        };

        string? completenessNotes = citedArtifactIds.Count < 2
            ? "Fewer than two artifacts were cited; completeness may be limited."
            : null;

        EvidenceValidationStageOutcome completenessStage = new()
        {
            Stage = EvidenceValidationStage.Completeness,
            Passed = citedArtifactIds.Count >= 2,
            Detail = completenessNotes ?? "At least two artifacts were cited.",
            IsDeterministic = false,
        };

        bool escalated = !integrityPassed
            || claimedConclusion.Contains("Critical", StringComparison.OrdinalIgnoreCase);

        EvidenceValidationStageOutcome escalationStage = new()
        {
            Stage = EvidenceValidationStage.Escalation,
            Passed = !escalated,
            Detail = escalated ? "Escalation required due to integrity failure or critical severity." : "No escalation required.",
            IsDeterministic = false,
        };

        return new EvidenceValidationResult
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

            if (!sourceStore.VerifyIntegrity(artifactId, expectedQuote))
            {
                return false;
            }
        }

        return true;
    }
}
