using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for the <see cref="PolicyPackContentDocumentValidator" /> elicitation-question rules
///     introduced in ADR 0051 (R8 — packs own their questions).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPackContentDocumentElicitationQuestionValidatorTests
{
    private readonly PolicyPackContentDocumentValidator _validator = new();

    // ── backward-compatibility ────────────────────────────────────────────────

    [SkippableFact]
    public void Validate_Succeeds_WhenElicitationQuestionsAbsent()
    {
        PolicyPackContentDocument doc = new();

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public void Validate_Succeeds_WhenElicitationQuestionsEmpty()
    {
        PolicyPackContentDocument doc = new() { ElicitationQuestions = [] };

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeTrue();
    }

    // ── valid question ────────────────────────────────────────────────────────

    [SkippableFact]
    public void Validate_Succeeds_WithValidQuestion_ReferencingExistingRuleKey()
    {
        PolicyPackContentDocument doc = new()
        {
            ComplianceRuleKeys = ["network-encryption-at-rest"],
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "q-encryption-at-rest",
                    Prompt = "Is data encrypted at rest?",
                    Tier = ElicitationQuestionTier.Must,
                    AnswerKind = ElicitationAnswerKind.Bool,
                    RuleKeys = ["network-encryption-at-rest"],
                },
            ],
        };

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public void Validate_Succeeds_WithValidQuestion_EmptyRuleKeys()
    {
        PolicyPackContentDocument doc = new()
        {
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "q-cross-cutting",
                    Prompt = "Describe the primary business outcome.",
                    Tier = ElicitationQuestionTier.Must,
                    AnswerKind = ElicitationAnswerKind.Text,
                    RuleKeys = [],
                },
            ],
        };

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeTrue();
    }

    // ── QuestionKey validation ────────────────────────────────────────────────

    [SkippableFact]
    public void Validate_Fails_WhenQuestionKeyEmpty()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.QuestionKey = "");

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("QuestionKey"));
    }

    [SkippableFact]
    public void Validate_Fails_WhenQuestionKeyExceedsMaxLength()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.QuestionKey = new string('x', 201));

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("QuestionKey"));
    }

    // ── Prompt validation ─────────────────────────────────────────────────────

    [SkippableFact]
    public void Validate_Fails_WhenPromptEmpty()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.Prompt = "");

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Prompt"));
    }

    [SkippableFact]
    public void Validate_Fails_WhenPromptExceedsMaxLength()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.Prompt = new string('p', 1001));

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Prompt"));
    }

    // ── RuleKeys validation ───────────────────────────────────────────────────

    [SkippableFact]
    public void Validate_Fails_WhenRuleKeyIsEmpty()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.RuleKeys = [""]);

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("RuleKeys"));
    }

    [SkippableFact]
    public void Validate_Fails_WhenRuleKeyExceedsMaxLength()
    {
        PolicyPackContentDocument doc = BuildDocWithQuestion(q => q.RuleKeys = [new string('r', 501)]);

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
    }

    // ── dangling rule-key cross-reference ─────────────────────────────────────

    [SkippableFact]
    public void Validate_Fails_WhenRuleKeyDoesNotExistInPack()
    {
        PolicyPackContentDocument doc = new()
        {
            ComplianceRuleKeys = ["existing-rule"],
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "q-dangling",
                    Prompt = "Some question.",
                    Tier = ElicitationQuestionTier.Should,
                    AnswerKind = ElicitationAnswerKind.Bool,
                    RuleKeys = ["nonexistent-rule"],
                },
            ],
        };

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("complianceRuleKeys"));
    }

    [SkippableFact]
    public void Validate_Succeeds_WhenRuleKeyIsCaseInsensitiveMatchInPack()
    {
        PolicyPackContentDocument doc = new()
        {
            ComplianceRuleKeys = ["Network-Encryption-At-Rest"],
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "q-enc",
                    Prompt = "Encrypted?",
                    Tier = ElicitationQuestionTier.Must,
                    AnswerKind = ElicitationAnswerKind.Bool,
                    RuleKeys = ["network-encryption-at-rest"],
                },
            ],
        };

        ValidationResult result = _validator.Validate(doc);

        result.IsValid.Should().BeTrue();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static PolicyPackContentDocument BuildDocWithQuestion(Action<ElicitationQuestion> configure)
    {
        ElicitationQuestion question = new()
        {
            QuestionKey = "q-valid-key",
            Prompt = "Valid prompt.",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Bool,
            RuleKeys = [],
        };

        configure(question);

        return new PolicyPackContentDocument { ElicitationQuestions = [question] };
    }
}
