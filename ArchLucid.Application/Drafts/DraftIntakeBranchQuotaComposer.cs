using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Drafts;

/// <summary>Builds <see cref="DraftBranchQuotaResponse" /> from options and existing child-branch count.</summary>
public static class DraftIntakeBranchQuotaComposer
{
    public static DraftBranchQuotaResponse Compose(Guid draftId, int existingBranchCount, DraftIntakeBranchOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        int maxBranches = ResolveMaxBranches(options);
        int remaining = Math.Max(0, maxBranches - existingBranchCount);

        return new DraftBranchQuotaResponse
        {
            DraftId = draftId,
            ExistingBranchCount = existingBranchCount,
            MaxBranchesPerParent = maxBranches,
            RemainingBranches = remaining,
            CanBranch = remaining > 0,
            EstimatedBranchRunCostUsd = Math.Max(0m, options.EstimatedBranchRunCostUsd),
        };
    }

    public static int ResolveMaxBranches(DraftIntakeBranchOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        return Math.Clamp(options.MaxBranchesPerParentDraft, 1, 20);
    }
}
