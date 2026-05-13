using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfluencePublishingSpaceKeyResolverTests
{
    [Fact]
    public void Resolve_uses_dictionary_entry_that_matches_project_id_before_default_space_key()
    {
        Guid mappedProject = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ConfluencePublishingOptions opts = new()
        {
            SpaceKey = "FALLBACK",
            ProjectSpaceKeys = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [mappedProject.ToString("D")] = "TEAM_MAPPED",
            },
        };

        ConfluencePublishingSpaceKeyResolver.Resolve(opts, mappedProject).Should().Be("TEAM_MAPPED");
        ConfluencePublishingSpaceKeyResolver.Resolve(opts, Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).Should().Be("FALLBACK");
    }
}
