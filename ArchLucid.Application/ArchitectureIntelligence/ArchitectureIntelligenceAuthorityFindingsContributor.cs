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
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
    IAsyncSpecialistReviewService specialistReviewService,
    IAdversarialReviewService adversarialReviewService) : IArchitectureIntelligenceAuthorityFindingsContributor
{
    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
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

        if (_knowledgeModelAccess is null || !Guid.TryParse(runId, out Guid parsedRunId))
            return [];

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, parsedRunId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return [];

        SpecialistReviewResult review = await _specialistReviewService
            .ReviewAsync(model, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        List<SpecialistReviewFinding> specialistFindings = review.Findings;

        if (specialistFindings.Count == 0)
            return [];

        AdversarialReviewResult adversarial = _adversarialReviewService.Review(specialistFindings);

        List<Finding> findings = ArchitectureIntelligenceProductBridge.ToFindings(adversarial.SubstantiatedFindings);

        return findings;
    }
}
