using ArchLucid.Application.Drafts;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftIntakeBranchQuotaComposerTests
{
    [Fact]
    public void Compose_calculates_remaining_branches_and_can_branch()
    {
        DraftIntakeBranchOptions options = new() { MaxBranchesPerParentDraft = 3, EstimatedBranchRunCostUsd = 1.25m };
        Guid draftId = Guid.NewGuid();

        var quota = DraftIntakeBranchQuotaComposer.Compose(draftId, existingBranchCount: 1, options);

        quota.DraftId.Should().Be(draftId);
        quota.ExistingBranchCount.Should().Be(1);
        quota.MaxBranchesPerParent.Should().Be(3);
        quota.RemainingBranches.Should().Be(2);
        quota.CanBranch.Should().BeTrue();
        quota.EstimatedBranchRunCostUsd.Should().Be(1.25m);
    }

    [Fact]
    public void Compose_sets_can_branch_false_when_cap_reached()
    {
        DraftIntakeBranchOptions options = new() { MaxBranchesPerParentDraft = 2 };

        var quota = DraftIntakeBranchQuotaComposer.Compose(Guid.NewGuid(), existingBranchCount: 2, options);

        quota.RemainingBranches.Should().Be(0);
        quota.CanBranch.Should().BeFalse();
    }
}
