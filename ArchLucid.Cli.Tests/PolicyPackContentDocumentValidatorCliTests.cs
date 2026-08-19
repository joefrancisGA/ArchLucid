using ArchLucid.Cli.Validation;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackContentDocumentValidatorCliTests
{
    private readonly PolicyPackContentDocumentValidator _validator = new();

    [Fact]
    public void Validate_succeeds_for_minimal_valid_document()
    {
        PolicyPackContentDocument document = new()
        {
            ComplianceRuleKeys = ["network-encryption-at-rest"],
        };

        ValidationResult result = _validator.Validate(document);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_fails_when_compliance_rule_ids_contain_empty_guid()
    {
        PolicyPackContentDocument document = new()
        {
            ComplianceRuleIds = [Guid.Empty],
        };

        ValidationResult result = _validator.Validate(document);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("empty GUID", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_fails_when_elicitation_rule_key_not_in_pack()
    {
        PolicyPackContentDocument document = new()
        {
            ComplianceRuleKeys = ["known-rule"],
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "q-1",
                    Prompt = "Is encryption enabled?",
                    RuleKeys = ["unknown-rule"],
                },
            ],
        };

        ValidationResult result = _validator.Validate(document);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.ErrorMessage.Contains("complianceRuleKeys", StringComparison.OrdinalIgnoreCase));
    }
}
