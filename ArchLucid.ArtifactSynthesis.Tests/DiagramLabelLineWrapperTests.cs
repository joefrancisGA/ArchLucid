using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramLabelLineWrapperTests
{
    [Fact]
    public void Wrap_keeps_short_names_on_one_line()
    {
        DiagramLabelLineWrapper.Wrap("vm-app", maxWidthPx: 200, characterWidth: 7.6)
            .Should()
            .Equal("vm-app");
    }

    [Fact]
    public void Wrap_breaks_hyphenated_azure_names()
    {
        IReadOnlyList<string> lines = DiagramLabelLineWrapper.Wrap(
            "vnet-userprovision-hi-nonprod01",
            maxWidthPx: 160,
            characterWidth: 7.6);

        lines.Count.Should().BeGreaterThan(1);
        string.Concat(lines).Should().Be("vnet-userprovision-hi-nonprod01");
    }
}
