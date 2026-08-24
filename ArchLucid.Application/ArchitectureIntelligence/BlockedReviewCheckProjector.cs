using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Projects blocked governance / review checks into <see cref="ArchitectureElementKind.UnresolvedQuestion" />
///     elements on the knowledge model.
/// </summary>
public interface IBlockedReviewCheckProjector
{
    Task<int> ProjectBlockedChecksAsync(
        ScopeContext scope,
        string runId,
        PreCommitGateResult gateResult,
        CancellationToken cancellationToken = default);
}

public sealed class BlockedReviewCheckProjector(
    IArchitectureIntelligencePersistence? persistence) : IBlockedReviewCheckProjector
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;

    public async Task<int> ProjectBlockedChecksAsync(
        ScopeContext scope,
        string runId,
        PreCommitGateResult gateResult,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(gateResult);

        if (_persistence is null || !gateResult.Blocked)
            return 0;

        ArchitectureKnowledgeModel? model = await _persistence
            .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return 0;

        int added = 0;
        HashSet<string> existingNames = model.Elements
            .Where(element => element.Kind == ArchitectureElementKind.UnresolvedQuestion)
            .Select(element => element.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string blockingFindingId in gateResult.BlockingFindingIds)
        {
            string questionName = $"blocked-check:{blockingFindingId}";

            if (existingNames.Contains(questionName))
                continue;

            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = Guid.NewGuid().ToString("N"),
                Kind = ArchitectureElementKind.UnresolvedQuestion,
                Name = questionName,
                Description = gateResult.Reason ?? "Blocked pre-finalize governance check.",
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.SystemProposed,
                    SupportStatus = SupportStatus.IndirectlySupported,
                    Notes = "Derived from blocked pre-commit governance gate.",
                },
            });

            existingNames.Add(questionName);
            added++;
        }

        if (added > 0)
        {
            model.IsProvisionalSynthesis = true;
            model.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
            await _persistence.SaveModelAsync(model, cancellationToken).ConfigureAwait(false);
        }

        return added;
    }
}
