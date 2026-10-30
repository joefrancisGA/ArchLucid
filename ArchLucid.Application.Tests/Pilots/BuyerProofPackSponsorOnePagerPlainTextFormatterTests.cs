using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorOnePagerPlainTextFormatterTests
{
    [Fact]
    public void FormatRunHeaderLine_when_run_id_contains_pipe_quotes_run_id()
    {
        PilotSponsorOnePagerPlainTextFormatter.FormatRunHeaderLine("run|kpi")
            .Should()
            .Be("Run: 'run|kpi'");
    }

    [Fact]
    public void FormatManifestVersionLine_when_version_contains_pipe_quotes_version()
    {
        PilotSponsorOnePagerPlainTextFormatter.FormatManifestVersionLine("v2|beta")
            .Should()
            .Be("Manifest version: 'v2|beta'");
    }
}
