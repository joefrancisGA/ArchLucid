using System.Text.Json;

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

    [Fact]
    public void ListTemplates_includes_organization_starter_with_org_rule_ids()
    {
        PolicyPackRuleTemplatesService sut = new();

        PolicyPackRuleTemplateItem template = sut.ListTemplates()
            .Single(t => t.TemplateId == "organization-security-architecture-starter");

        template.Category.Should().Be("Organization");
        template.ContentJson.Should().Contain("{{organization.allowedRegions}}");

        using JsonDocument document = JsonDocument.Parse(template.ContentJson);
        JsonElement keys = document.RootElement.GetProperty("complianceRuleKeys");

        // CS8122: FluentAssertions OnlyContain compiles to an expression tree; use != null instead of `is not null`.
        keys.EnumerateArray().Select(key => key.GetString()).Should().OnlyContain(
            key => key != null && key.StartsWith("org-", StringComparison.Ordinal));
    }
}
