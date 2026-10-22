using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration.Create.Hooks;

public interface IArchitectureRunCreateIdentityLinkHook
{
    Task TryLinkReviewRunArchitectureIdentityAsync(
        ArchitectureRequest request,
        string runId,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunCreateIdentityLinkHook(
    IArchitectureIdentityService architectureIdentityService,
    IArchitectureVersionService architectureVersionService,
    IScopeContextProvider scopeContextProvider,
    IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess) : IArchitectureRunCreateIdentityLinkHook
{
    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly IArchitectureVersionService _architectureVersionService =
        architectureVersionService ?? throw new ArgumentNullException(nameof(architectureVersionService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchitectureKnowledgeModelAccess _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess ?? throw new ArgumentNullException(nameof(architectureKnowledgeModelAccess));

    public async Task TryLinkReviewRunArchitectureIdentityAsync(
        ArchitectureRequest request,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseCoordinationRunGuid(runId, out Guid reviewRunGuid))
        {
            throw new ArchitecturePinningFailedException(
                $"Review run architecture link failed: invalid RunId '{LogSanitizer.Sanitize(runId)}'.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        ArchitectureIdentityRecord? identity = await _architectureIdentityService
            .TryEnsureReviewRunLinkedAsync(scope, reviewRunGuid, request, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        if (identity?.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
        {
            throw new ArchitecturePinningFailedException(
                $"Review run architecture identity link failed for RunId={LogSanitizer.Sanitize(runId)}.");
        }

        // Inline create runs closed-loop κ persist before this hook mints ArchitectureId, so
        // SaveForRunAsync cannot re-pin. Hash the already-saved model (when present) instead of
        // intake-only, or finalize 409s golden-cohort nightly with κ drift.
        ArchitectureKnowledgeModel? knowledgeModel = await _architectureKnowledgeModelAccess
            .GetForRunAsync(scope, reviewRunGuid, cancellationToken)
            .ConfigureAwait(false);

        await _architectureVersionService
            .EnsureRunVersionPinnedAsync(
                scope,
                reviewRunGuid,
                architectureId,
                request,
                knowledgeModel,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
