using ArchLucid.Application.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackRuleTemplatesServiceTests
{
    [Fact]
    public void ListTemplates_returns_bundled_starter_templates()
    {
        PolicyPackRuleTemplatesService sut = new();

        IReadOnlyList<PolicyPackRuleTemplateItem> templates = sut.ListTemplates();

        templates.Should().NotBeEmpty();
        templates.Should().OnlyContain(t => !string.IsNullOrWhiteSpace(t.TemplateId));
        templates.Should().OnlyContain(t => !string.IsNullOrWhiteSpace(t.ContentJson));
    }
}
