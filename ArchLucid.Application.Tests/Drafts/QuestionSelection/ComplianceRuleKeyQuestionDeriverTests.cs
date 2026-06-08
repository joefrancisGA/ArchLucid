using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts.QuestionSelection;

[Trait("Category", "Unit")]
public sealed class ComplianceRuleKeyQuestionDeriverTests
{
    [Fact]
    public void Derive_BuildsStableDerivedKeyAndShouldTier()
    {
        DraftElicitationQuestion question = ComplianceRuleKeyQuestionDeriver.Derive("saas-ctrl-001");

        question.QuestionKey.Should().Be("l1.rule.saas-ctrl-001");
        question.Tier.Should().Be(ElicitationQuestionTier.Should);
        question.Source.Should().Be(ElicitationQuestionSource.L1PackDerived);
        question.Prompt.Should().Contain("saas-ctrl-001");
    }
}
