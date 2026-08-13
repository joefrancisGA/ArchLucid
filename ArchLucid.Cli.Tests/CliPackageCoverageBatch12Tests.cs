using ArchLucid.Cli;
using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch12Tests
{
    [Fact]
    public void SponsorPacketIndexBuilder_marks_present_and_extra_files()
    {
        string markdown = SponsorPacketIndexBuilder.Build(
            " run-99 ",
            @"C:\packets\run-99",
            [SponsorPacketArtifactCatalog.IndexFileName, "custom-appendix.json"]);

        markdown.Should().Contain("**Run id:** `run-99`");
        markdown.Should().Contain("| `index.md` |");
        markdown.Should().Contain("| `custom-appendix.json` | Supporting governance or readiness artifact | yes |");
        markdown.Should().Contain("archlucid sponsor-packet run-99");
    }

    [Fact]
    public void SponsorPacketIndexBuilder_rejects_blank_inputs()
    {
        Action blankRunId = () => SponsorPacketIndexBuilder.Build(" ", "out", []);
        Action blankDirectory = () => SponsorPacketIndexBuilder.Build("run-1", " ", []);
        Action nullFiles = () => SponsorPacketIndexBuilder.Build("run-1", "out", null!);

        blankRunId.Should().Throw<ArgumentException>();
        blankDirectory.Should().Throw<ArgumentException>();
        nullFiles.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void SponsorPacketBuyerDecisionBriefBuilder_Build_marks_hold_disposition_from_limitations()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId: "run-hold",
            PackManifestJson: """{"demoDataWarning":false,"generatedUtc":"2026-07-24T00:00:00Z"}""",
            SponsorReportJson: """{"totalEstimatedUsdSavings":25000,"headlineSavingsScopeDescription":"Committed findings","systemCount":1}""",
            LimitationsMd: """
                           # Limitations

                           ## Hold reasons

                           - Missing procurement attestation
                           """,
            FirstValueReportMd: "# First value report\n\nCommitted run identified savings.");

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        brief.Should().Contain("run-hold");
        brief.Should().Contain("25,000");
        brief.Should().Contain("Missing procurement attestation");
        brief.Should().Contain("HOLD");
    }

    [Fact]
    public void SponsorPacketBuyerDecisionBriefBuilder_Build_rejects_blank_run_id()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId: " ",
            PackManifestJson: null,
            SponsorReportJson: null,
            LimitationsMd: null,
            FirstValueReportMd: null);

        Action act = () => SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void SupportBundleTriageCatalog_entries_reference_known_bundle_files()
    {
        IReadOnlyList<SupportBundleTriageEntry> entries = SupportBundleTriageCatalog.Entries;

        entries.Should().NotBeEmpty();
        entries.Select(entry => entry.File).Should().OnlyHaveUniqueItems();
        entries[0].File.Should().Be(SupportBundleArchiveWriter.TriageIndexJsonFileName);
        entries.Should().Contain(entry => entry.File == SupportBundleArchiveWriter.HealthFileName);
    }

    [Fact]
    public void SupportBundleCorrelationTraceCatalog_exposes_stable_guidance_bullets()
    {
        SupportBundleCorrelationTraceCatalog.GuidanceBullets.Should().HaveCountGreaterThan(1);
        SupportBundleCorrelationTraceCatalog.GuidanceBullets
            .Should()
            .Contain(bullet => bullet.Contains("X-Correlation-ID", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(CliExitCode.Success, 0)]
    [InlineData(CliExitCode.UsageError, 1)]
    [InlineData(CliExitCode.ConfigurationError, 2)]
    [InlineData(CliExitCode.ApiUnavailable, 3)]
    [InlineData(CliExitCode.OperationFailed, 4)]
    public void CliExitCode_exposes_stable_process_codes(int actual, int expected)
    {
        actual.Should().Be(expected);
    }

    [Fact]
    public void CliExecutionContext_stripLeadingGlobalJsonFlags_parses_json_prefix()
    {
        string[] stripped = CliExecutionContext.StripLeadingGlobalJsonFlags(["--json", "runs", "list"], out bool parsedJson);

        parsedJson.Should().BeTrue();
        stripped.Should().Equal(["runs", "list"]);
    }

    [Fact]
    public void CliExecutionContext_stripLeadingGlobalJsonFlags_leaves_args_when_json_absent()
    {
        string[] stripped = CliExecutionContext.StripLeadingGlobalJsonFlags(["runs", "list"], out bool parsedJson);

        parsedJson.Should().BeFalse();
        stripped.Should().Equal(["runs", "list"]);
    }

    [Fact]
    public void PilotProofPacketArtifactCatalog_core_inventory_includes_index_and_evidence_files()
    {
        IReadOnlyList<string> core = PilotProofPacketArtifactCatalog.CoreFileNames;

        core.Should().Contain("sponsor-proof-packet-index.json");
        core.Should().Contain("run-evidence.json");
        core.Should().Contain("redaction-manifest.json");
        PilotProofPacketArtifactCatalog.IndexSchema.Should().Be("archlucid.proof-packet.index.v1");
    }
}
