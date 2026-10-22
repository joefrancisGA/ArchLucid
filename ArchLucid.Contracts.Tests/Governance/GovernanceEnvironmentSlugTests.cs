using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceEnvironmentSlugTests
{
    [Fact]
    public void MaxLength_matches_workflow_and_catalog_persisted_width()
    {
        GovernanceEnvironmentSlug.MaxLength.Should().Be(64);
    }
}
