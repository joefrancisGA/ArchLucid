using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Projects specialist / closed-loop review findings into authority <see cref="Finding" /> rows
///     for merge into <see cref="FindingsSnapshot" />.
/// </summary>
public interface IArchitectureIntelligenceAuthorityFindingsContributor
{
    Task<IReadOnlyList<Finding>> ContributeAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureIntelligenceAuthorityFindingsContributor(
    IArchitectureIntelligencePersistence? persistence,
    ISpecialistReviewService specialistReviewService,
    IAdversarialReviewService adversarialReviewService) : IArchitectureIntelligenceAuthorityFindingsContributor
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;

    private readonly ISpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IAdversarialReviewService _adversarialReviewService =
        adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));

    public async Task<IReadOnlyList<Finding>> ContributeAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (_persistence is null)
            return [];

        ArchitectureKnowledgeModel? model = await _persistence
            .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return [];

        SpecialistReviewResult review = _specialistReviewService.Review(model);
        List<SpecialistReviewFinding> specialistFindings = review.Findings;

        if (specialistFindings.Count == 0)
            return [];

        AdversarialReviewResult adversarial = _adversarialReviewService.Review(specialistFindings);

        List<Finding> findings = ArchitectureIntelligenceProductBridge.ToFindings(adversarial.SubstantiatedFindings);
        findings.AddRange(ArchitectureIntelligenceProductBridge.ToHypothesisLaneFindings(adversarial.Challenges));

        return findings;
    }
}
