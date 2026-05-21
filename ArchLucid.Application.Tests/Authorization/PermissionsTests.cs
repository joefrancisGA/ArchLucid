using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Authorization;

[Trait("Category", "Unit")]
public sealed class PermissionsTests
{
    [SkippableFact]
    public void ValidateAndNormalize_rejects_unknown_permission()
    {
        Action act = () => Permissions.ValidateAndNormalize(["Runs.Read", "Not.A.Permission"]);

        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void ValidateAndNormalize_deduplicates_and_trims()
    {
        IReadOnlyList<string> normalized = Permissions.ValidateAndNormalize([" Runs.Read ", "Runs.Read", "Findings.Read"]);

        normalized.Should().Equal("Runs.Read", "Findings.Read");
    }
}
