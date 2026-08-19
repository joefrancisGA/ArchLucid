using ArchLucid.ArtifactSynthesis.Validation;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RegexTerraformValidatorTests
{
    private readonly RegexTerraformValidator _sut = new();

    [Fact]
    public void Validate_comment_only_hcl_is_valid()
    {
        const string hcl = """
            # ArchLucid advisory – review before apply
            # No changes emitted.
            """;

        _sut.Validate(hcl).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_balanced_resource_block_is_valid()
    {
        const string hcl = """
            resource "azurerm_resource_group" "rg" {
              name = "example"
            }
            """;

        _sut.Validate(hcl).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_unclosed_resource_block_is_invalid()
    {
        const string hcl = """resource "azurerm_resource_group" "rg" { name = "x" """;

        _sut.Validate(hcl).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_resource_header_without_body_is_invalid()
    {
        const string hcl = """resource "azurerm_resource_group" "rg" """;

        _sut.Validate(hcl).IsValid.Should().BeFalse();
    }
}
