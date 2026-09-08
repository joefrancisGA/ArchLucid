using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    private async Task EnsureRegistersSealedManifestOrThrowAsync(Guid resolvedProjectId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
            scope.TenantId,
            scope.WorkspaceId,
            resolvedProjectId,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);
    }
}
