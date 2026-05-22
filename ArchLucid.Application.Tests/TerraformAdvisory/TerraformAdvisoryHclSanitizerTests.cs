using ArchLucid.Application.TerraformAdvisory;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Terraform;

using FluentAssertions;

namespace ArchLucid.Application.Tests.TerraformAdvisory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TerraformAdvisoryHclSanitizerTests
{
    [Fact]
    public void SanitizeLlmTerraformBlock_when_malformed_hcl_returns_warning_stub()
    {
        const string llmOutput = """resource "bad" "x" { name = """;

        string sanitized = TerraformAdvisorySnippetTemplates.SanitizeLlmTerraformBlock(llmOutput);

        sanitized.Should().Contain(TerraformAdvisoryHclSanitizer.ValidationWarningPrefix);
        sanitized.Should().NotContain("resource \"bad\"");
    }

    [Fact]
    public void SanitizeLlmTerraformBlock_when_valid_hcl_returns_original()
    {
        const string llmOutput = """
            # advisory only
            resource "azurerm_resource_group" "rg" {
              name = "demo"
            }
            """;

        string sanitized = TerraformAdvisorySnippetTemplates.SanitizeLlmTerraformBlock(llmOutput);

        sanitized.Should().Be(llmOutput);
    }

    [Fact]
    public void ValidateAndSanitize_uses_injected_validator()
    {
        AlwaysInvalidValidator validator = new();
        string result = TerraformAdvisoryHclSanitizer.ValidateAndSanitize("# ok", validator);

        result.Should().Contain(TerraformAdvisoryHclSanitizer.ValidationWarningPrefix);
    }

    private sealed class AlwaysInvalidValidator : ITerraformValidator
    {
        public TerraformValidationOutcome Validate(string hclBody) =>
            TerraformValidationOutcome.Invalid("forced test failure");
    }
}
