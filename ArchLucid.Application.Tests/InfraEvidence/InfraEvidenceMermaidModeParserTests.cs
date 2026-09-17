using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InfraEvidenceMermaidModeParserTests
{
    [Fact]
    public void TryParse_executive_without_hidden_tiers_has_no_compile_options()
    {
        bool parsed = InfraEvidenceMermaidModeParser.TryParse("executive", null, out InfraEvidenceMermaidModeParseResult result);

        parsed.Should().BeTrue();
        result.DiagramMode.Should().Be(DiagramMode.Executive);
        result.CompileOptions.Should().BeNull();
    }

    [Fact]
    public void TryParse_executive_with_hidden_tiers_maps_known_keys_into_compile_options()
    {
        bool parsed = InfraEvidenceMermaidModeParser.TryParse(
            "executive",
            null,
            "storage,Integration,bogus",
            out InfraEvidenceMermaidModeParseResult result);

        parsed.Should().BeTrue();
        result.CompileOptions.Should().NotBeNull();
        result.CompileOptions!.HiddenExecutiveTierKeys.Should().Equal(
            ExecutiveAlwaysShowTiers.StorageKey,
            ExecutiveAlwaysShowTiers.IntegrationKey);
    }

    [Fact]
    public void TryParse_executive_with_only_unknown_hidden_tiers_has_no_compile_options()
    {
        InfraEvidenceMermaidModeParser.TryParse("executive", null, "bogus", out InfraEvidenceMermaidModeParseResult result);

        result.CompileOptions.Should().BeNull();
    }

    [Fact]
    public void TryParse_ignores_hidden_tiers_outside_executive_mode()
    {
        InfraEvidenceMermaidModeParser.TryParse("network", null, "storage", out InfraEvidenceMermaidModeParseResult result);

        result.DiagramMode.Should().Be(DiagramMode.Network);
        result.CompileOptions.Should().BeNull();
    }

    [Fact]
    public void TryParse_rejects_blank_mode()
    {
        bool parsed = InfraEvidenceMermaidModeParser.TryParse("  ", null, out InfraEvidenceMermaidModeParseResult result);

        parsed.Should().BeFalse();
        result.ErrorMessage.Should().Be("Mode is required.");
    }

    [Fact]
    public void TryParse_dataFlow_maps_to_data_flow_diagram_mode()
    {
        bool parsed = InfraEvidenceMermaidModeParser.TryParse("dataFlow", null, out InfraEvidenceMermaidModeParseResult result);

        parsed.Should().BeTrue();
        result.DiagramMode.Should().Be(DiagramMode.DataFlow);
        result.ModeKey.Should().Be("dataFlow");
    }

    [Fact]
    public void TryParse_dataArchitecture_maps_to_data_architecture_diagram_mode()
    {
        bool parsed = InfraEvidenceMermaidModeParser.TryParse("dataArchitecture", null, out InfraEvidenceMermaidModeParseResult result);

        parsed.Should().BeTrue();
        result.DiagramMode.Should().Be(DiagramMode.DataArchitecture);
        result.ModeKey.Should().Be("dataArchitecture");
    }
}
