using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Merges incremental re-review specialist findings into closed-loop publish inputs.
/// </summary>
public static class ClosedLoopReReviewPublishIntegrator
{
    public static async Task<SpecialistFindingsSubstantiationResult?> IntegrateAsync(
        IncrementalReReviewResult reReview,
        List<SpecialistReviewFinding> allFindings,
        List<EvidenceValidationResult> validationResults,
        Dictionary<string, EvidenceValidationResult> validationByFindingId,
        ISpecialistFindingsSubstantiationService substantiationService,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reReview);
        ArgumentNullException.ThrowIfNull(allFindings);
        ArgumentNullException.ThrowIfNull(validationResults);
        ArgumentNullException.ThrowIfNull(validationByFindingId);
        ArgumentNullException.ThrowIfNull(substantiationService);

        List<SpecialistReviewFinding> incrementalFindings = SelectNewIncrementalFindings(reReview, allFindings);

        if (incrementalFindings.Count == 0)
            return null;

        SpecialistFindingsSubstantiationResult substantiation = await substantiationService
            .SubstantiateAsync(incrementalFindings, cancellationToken)
            .ConfigureAwait(false);

        IntegrateFromSubstantiation(
            incrementalFindings,
            substantiation,
            allFindings,
            validationResults,
            validationByFindingId);

        return substantiation;
    }

    public static void IntegrateFromSubstantiation(
        IReadOnlyList<SpecialistReviewFinding> incrementalFindings,
        SpecialistFindingsSubstantiationResult substantiation,
        List<SpecialistReviewFinding> allFindings,
        List<EvidenceValidationResult> validationResults,
        Dictionary<string, EvidenceValidationResult> validationByFindingId)
    {
        ArgumentNullException.ThrowIfNull(incrementalFindings);
        ArgumentNullException.ThrowIfNull(substantiation);
        ArgumentNullException.ThrowIfNull(allFindings);
        ArgumentNullException.ThrowIfNull(validationResults);
        ArgumentNullException.ThrowIfNull(validationByFindingId);

        if (incrementalFindings.Count == 0)
            return;

        allFindings.AddRange(incrementalFindings);

        foreach (EvidenceValidationResult validation in substantiation.ValidationResults)
        {
            validationResults.Add(validation);
            validationByFindingId[validation.FindingId] = validation;
        }

        foreach (SpecialistReviewFinding finding in incrementalFindings)
        {
            if (!validationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation))
                continue;

            EvidenceSupportTierResolver.ApplyToFinding(finding, validation);
        }
    }

    internal static List<SpecialistReviewFinding> SelectNewIncrementalFindings(
        IncrementalReReviewResult reReview,
        IReadOnlyList<SpecialistReviewFinding> allFindings)
    {
        ArgumentNullException.ThrowIfNull(reReview);
        ArgumentNullException.ThrowIfNull(allFindings);

        HashSet<string> knownFindingIds = allFindings
            .Select(static finding => finding.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        return reReview.SpecialistResults
            .SelectMany(static result => result.Findings)
            .Where(finding => !string.IsNullOrWhiteSpace(finding.FindingId))
            .Where(finding => !knownFindingIds.Contains(finding.FindingId))
            .ToList();
    }
}
