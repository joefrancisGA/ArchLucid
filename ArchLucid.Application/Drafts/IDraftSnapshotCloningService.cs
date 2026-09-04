using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Creates a new editable draft from a run-spawned snapshot (WA-10).</summary>
public interface IDraftSnapshotCloningService
{
    Task<CloneSnapshotDraftResponse?> CloneSnapshotAsync(
        ScopeContext scope,
        Guid sourceDraftId,
        string actorUserId,
        CancellationToken cancellationToken);
}
