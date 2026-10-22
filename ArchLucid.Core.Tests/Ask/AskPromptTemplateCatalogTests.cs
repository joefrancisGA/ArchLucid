using ArchLucid.Core.Ask;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Ask;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AskPromptTemplateCatalogTests
{
    [Fact]
    public void AskPromptTemplateCatalog_ReturnsPopulatedDistinctStarterPrompts()
    {
        IReadOnlyList<AskPromptTemplate> templates = AskPromptTemplateCatalog.GetTemplates();

        templates.Should().HaveCount(5);
        templates.Select(template => template.Id).Should().OnlyHaveUniqueItems();
        templates.Select(template => template.Id).Should().Contain(
        [
            "security-boundaries",
            "single-points-of-failure",
            "cost-hotspots",
            "compliance-gaps",
            "prior-decisions",
        ]);

        templates.Should().AllSatisfy(template =>
        {
            template.Id.Should().NotBeNullOrWhiteSpace();
            template.Title.Should().NotBeNullOrWhiteSpace();
            template.Prompt.Should().NotBeNullOrWhiteSpace();
        });
    }

    [Fact]
    public void AskPromptTemplate_Defaults_AreEmptyStrings()
    {
        AskPromptTemplate template = new();

        template.Id.Should().BeEmpty();
        template.Title.Should().BeEmpty();
        template.Prompt.Should().BeEmpty();
    }
}
