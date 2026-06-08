using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts.QuestionSelection;

[Trait("Category", "Unit")]
public sealed class QuestionSelectionEngineTests
{
    private readonly Mock<IEffectiveGovernanceLoader> _governanceLoader = new();
    private readonly QuestionSelectionEngine _engine;

    public QuestionSelectionEngineTests()
    {
        _governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        _engine = new QuestionSelectionEngine(_governanceLoader.Object);
    }

    [Fact]
    public async Task SelectAsync_IncludesUniversalMustQuestions_WhenGovernanceEmpty()
    {
        DraftRequestDocument document = new() { FreeTextIntent = "Build a compliance workflow platform." };

        QuestionSelectionResult result = await _engine.SelectAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            document,
            CancellationToken.None);

        result.RequiredMustQuestionKeys.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count);
        result.PendingMustQuestions.Should().OnlyContain(question => question.Source == ElicitationQuestionSource.L0Universal);
    }

    [Fact]
    public async Task SelectAsync_ExcludesAnsweredMustQuestions()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Build a compliance workflow platform.",
            QuestionAnswers =
            {
                ["l0.actor.additional-kinds"] = "No other actors",
                ["l0.pillar.reliability"] = "99.9% uptime",
            },
        };

        QuestionSelectionResult result = await _engine.SelectAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            document,
            CancellationToken.None);

        result.RequiredMustQuestionKeys.Should().NotContain("l0.actor.additional-kinds");
        result.RequiredMustQuestionKeys.Should().NotContain("l0.pillar.reliability");
        result.RequiredMustQuestionKeys.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count - 2);
    }

    [Fact]
    public async Task SelectAsync_IncludesExplicitPackMustAndDerivedShould()
    {
        _governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument
            {
                ComplianceRuleKeys = ["saas-ctrl-001", "saas-ctrl-002"],
                ElicitationQuestions =
                [
                    new ElicitationQuestion
                    {
                        QuestionKey = "pack.logging",
                        Prompt = "Is centralized logging required?",
                        Tier = ElicitationQuestionTier.Must,
                        AnswerKind = ElicitationAnswerKind.Bool,
                        RuleKeys = ["saas-ctrl-001"],
                    },
                ],
            });

        DraftRequestDocument document = new() { FreeTextIntent = "Build a SaaS control plane." };

        QuestionSelectionResult result = await _engine.SelectAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            document,
            CancellationToken.None);

        result.AllQuestions.Should().Contain(question =>
            question.QuestionKey == "pack.logging" && question.Tier == ElicitationQuestionTier.Must);

        result.AllQuestions.Should().Contain(question =>
            question.QuestionKey == "l1.rule.saas-ctrl-002"
            && question.Tier == ElicitationQuestionTier.Should);

        result.AllQuestions.Should().NotContain(question => question.QuestionKey == "l1.rule.saas-ctrl-001");

        result.RequiredMustQuestionKeys.Should().Contain("pack.logging");
        result.RequiredMustQuestionKeys.Should().NotContain("l1.rule.saas-ctrl-002");
    }
}
