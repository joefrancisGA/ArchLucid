using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

internal static class ArchitectureWorkLeaseDraftAccess
{
    internal static bool IsMutableDraft(DraftRequestResponse? draft) =>
        draft is not null
        && draft.ArchitectureId is not null
        && draft.ArchitectureId != Guid.Empty
        && draft.Status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

    internal static bool CanMutateLease(
        ArchitectureShareAccessEvaluation access,
        bool hasExecuteAuthority) =>
        access.ArchitectureFound && access.CanDecide && hasExecuteAuthority;
}
