using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

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

    [Fact]
    public void Resolve_uses_default_space_key_when_configuration_binds_a_null_project_space_value()
    {
        Guid mappedProject = Guid.Parse("11111111-1111-1111-1111-111111111111");
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    [$"{ConfluencePublishingOptions.SectionName}:SpaceKey"] = "FALLBACK",
                    // JSON null for one project entry binds a null dictionary value.
                    [$"{ConfluencePublishingOptions.SectionName}:ProjectSpaceKeys:{mappedProject:D}"] = null,
                })
            .Build();
        ConfluencePublishingOptions options = new();
        configuration.GetSection(ConfluencePublishingOptions.SectionName).Bind(options);

        ConfluencePublishingSpaceKeyResolver.Resolve(options, mappedProject).Should().Be("FALLBACK");
    }

    [Fact]
    public void Resolve_returns_empty_when_configuration_binds_space_key_null()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    [$"{ConfluencePublishingOptions.SectionName}:SpaceKey"] = null,
                })
            .Build();
        ConfluencePublishingOptions options = new();
        configuration.GetSection(ConfluencePublishingOptions.SectionName).Bind(options);

        ConfluencePublishingSpaceKeyResolver.Resolve(options, Guid.NewGuid()).Should().BeEmpty();
    }
}
