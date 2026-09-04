using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authorization;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PermissionsTests
{
    [Fact]
    public void IsKnown_returns_true_for_canonical_permission()
    {
        Permissions.IsKnown(Permissions.RunsRead).Should().BeTrue();
    }

    [Fact]
    public void IsKnown_returns_false_for_padded_permission_without_trim()
    {
        Permissions.IsKnown(" Runs.Read ").Should().BeFalse(
            "IsKnown is an exact-match helper; ValidateAndNormalize trims before calling it");
    }

    [Fact]
    public void ValidateAndNormalize_trims_before_IsKnown_lookup()
    {
        IReadOnlyList<string> normalized = Permissions.ValidateAndNormalize([" Runs.Read "]);

        normalized.Should().Equal(Permissions.RunsRead);
    }
}
