using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TechnologyConsistencySystemPromptTemplateTests
{
    [Theory]
    [InlineData(typeof(TopologySystemPromptTemplate))]
    [InlineData(typeof(CostSystemPromptTemplate))]
    [InlineData(typeof(ComplianceSystemPromptTemplate))]
    [InlineData(typeof(CriticSystemPromptTemplate))]
    public void System_prompt_includes_technology_ledger_consistency_block(Type templateType)
    {
        string prompt = GetTemplateText(templateType);

        prompt.Should().Contain("Technology Ledger consistency (mandatory):");
        prompt.Should().Contain("Closed-world:");
        prompt.Should().Contain("Alternative-labeling:");
        prompt.Should().Contain("Cloud-neutral mode:");
        prompt.Should().Contain("Target-cloud awareness:");
    }

    [Fact]
    public void Compliance_template_uses_provider_neutral_control_guidance()
    {
        string prompt = ComplianceSystemPromptTemplate.GetText();

        prompt.Should().Contain("provider-neutral control themes");
        prompt.Should().NotContain("- Key Vault");
    }

    [Fact]
    public void Critic_template_does_not_require_named_azure_element_only()
    {
        string prompt = CriticSystemPromptTemplate.GetText();

        prompt.Should().NotContain("named Azure element");
        prompt.Should().Contain("named architecture element");
    }

    private static string GetTemplateText(Type templateType)
    {
        if (templateType == typeof(TopologySystemPromptTemplate))
            return TopologySystemPromptTemplate.GetText();

        if (templateType == typeof(CostSystemPromptTemplate))
            return CostSystemPromptTemplate.GetText();

        if (templateType == typeof(ComplianceSystemPromptTemplate))
            return ComplianceSystemPromptTemplate.GetText();

        if (templateType == typeof(CriticSystemPromptTemplate))
            return CriticSystemPromptTemplate.GetText();

        throw new ArgumentOutOfRangeException(nameof(templateType));
    }
}
