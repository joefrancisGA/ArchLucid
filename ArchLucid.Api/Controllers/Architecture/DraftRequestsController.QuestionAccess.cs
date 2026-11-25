using ArchLucid.Application.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    private async Task<DraftRequestAccessMetadata?> AuthorizeDraftQuestionAsync(
        ScopeContext scope, Guid draftId, bool requireDecide, CancellationToken cancellationToken)
    {
        if (draftId == Guid.Empty || User.Identity?.IsAuthenticated != true)
            return null;

        string actorId = _actorContext.GetActorId();
        if (string.IsNullOrWhiteSpace(actorId) || string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase))
            return null;

        DraftRequestAccessMetadata? facts = await _draftRequestRepository.GetAccessMetadataAsync(
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken);
        if (facts is null)
            return null;

        HashSet<Guid>? allowed = await DraftResourceAccessPolicy.AuthorizeAsync(
            facts, draftId, scope, actorId,
            async (architectureId, ct) =>
            {
                var access = await _architectureShareAccessGate.EvaluateArchitectureAsync(User, scope, architectureId, ct);
                return access.ArchitectureFound && access.CanRead && (!requireDecide || access.CanDecide);
            },
            async (runId, ct) =>
            {
                (bool found, bool canRead) = await _architectureShareAccessGate.EvaluateRunReadAsync(User, scope, runId, ct);
                return found && canRead;
            },
            cancellationToken);

        return allowed is null ? null : facts;
    }
}
