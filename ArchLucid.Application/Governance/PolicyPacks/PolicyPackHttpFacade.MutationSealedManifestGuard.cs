using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackHttpFacade
{
    private async Task EnsureMutationSealedManifestOrThrowAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);
    }
}
