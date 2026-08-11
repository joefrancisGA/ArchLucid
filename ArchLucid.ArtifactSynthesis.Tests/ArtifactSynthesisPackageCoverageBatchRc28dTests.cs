using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Terraform;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28d package-coverage batch: Terraform advisory sanitizer/validators, DOCX template loader, and Mermaid
///     artifact extraction edges.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28dTests
{
    [Fact]
    public void TerraformAdvisoryHclSanitizer_passthrough_and_warning_stub()
    {
        const string valid = "# ArchLucid advisory\r\nresource \"azurerm_resource_group\" \"rg\" { name = \"demo\" }";
        TerraformAdvisoryHclSanitizer.ValidateAndSanitize(valid, new AlwaysValidValidator())
            .Should()
            .Be(valid);

        string stub = TerraformAdvisoryHclSanitizer.ValidateAndSanitize("# body", new AlwaysInvalidValidator());
        stub.Should().Contain(TerraformAdvisoryHclSanitizer.ValidationWarningPrefix);
        stub.Should().Contain("forced failure");

        FluentActions
            .Invoking(() => TerraformAdvisoryHclSanitizer.ValidateAndSanitize(null!))
            .Should()
            .Throw<ArgumentNullException>();
        FluentActions
            .Invoking(() => TerraformAdvisoryHclSanitizer.BuildValidationWarningStub(" "))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void CliTerraformValidator_whitespace_is_valid_without_cli()
    {
        CliTerraformValidator validator = new();
        validator.Validate("   ").IsValid.Should().BeTrue();
    }

    [Fact]
    public void CompositeTerraformValidator_short_circuits_on_regex_failure()
    {
        TerraformValidationOutcome outcome = CompositeTerraformValidator.Instance.Validate(
            """resource "bad" "x" { name = """);

        outcome.IsValid.Should().BeFalse();
        outcome.FailureReason.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TemplateLoader_OpenWritableTemplate_returns_docx_stream()
    {
        using MemoryStream stream = TemplateLoader.OpenWritableTemplate();
        stream.Length.Should().BeGreaterThan(1_000);
        stream.Position.Should().Be(0);

        Span<byte> header = stackalloc byte[2];
        stream.ReadExactly(header);
        header[0].Should().Be(0x50);
        header[1].Should().Be(0x4B);
    }

    [Fact]
    public void MermaidDiagramArtifactExtractor_selects_mmd_and_truncates()
    {
        MermaidDiagramArtifactExtractor.TryGetDiagramSource([]).Should().BeNull();
        MermaidDiagramArtifactExtractor
            .TryGetDiagramSource([new SynthesizedArtifact { Name = "x.txt", Content = "  ", Format = "text" }])
            .Should()
            .BeNull();

        string? source = MermaidDiagramArtifactExtractor.TryGetDiagramSource(
        [
            new SynthesizedArtifact
            {
                Name = "flow.mmd",
                Format = "text",
                Content = "graph TD; A-->B;",
            },
        ]);
        source.Should().Be("graph TD; A-->B;");

        string? truncated = MermaidDiagramArtifactExtractor.TryGetDiagramSource(
        [
            new SynthesizedArtifact
            {
                Name = "big",
                Format = "mermaid",
                Content = new string('a', 40),
            },
        ],
        maxChars: 10);
        truncated.Should().NotBeNull();
        truncated.Should().StartWith(new string('a', 10));
        truncated.Should().Contain("truncated");
    }

    private sealed class AlwaysValidValidator : ITerraformValidator
    {
        public TerraformValidationOutcome Validate(string hclBody) => TerraformValidationOutcome.Valid();
    }

    private sealed class AlwaysInvalidValidator : ITerraformValidator
    {
        public TerraformValidationOutcome Validate(string hclBody) =>
            TerraformValidationOutcome.Invalid("forced failure");
    }
}
