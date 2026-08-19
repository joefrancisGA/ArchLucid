using System.Text;
using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch13Tests
{
    [Fact]
    public void SupportBundleRedactor_masks_pem_openai_keys_and_long_llm_json_strings()
    {
        const string pem = """
                           -----BEGIN RSA PRIVATE KEY-----
                           MIIEowIBAAKCAQEAfake
                           -----END RSA PRIVATE KEY-----
                           """;
        string openAi = "token sk-proj-abcdefghijklmnopqrstuvwxyz1234567890";
        string longPayload = new string('a', 401);
        string longLlm = $$"""{"content":"{{longPayload}}"}""";

        SupportBundleRedactor.RedactSensitivePatterns(pem).Should().Contain("[REDACTED_PRIVATE_KEY]");
        SupportBundleRedactor.RedactSensitivePatterns(openAi).Should().Contain("[REDACTED_API_KEY]");
        SupportBundleRedactor.RedactSensitivePatterns(longLlm).Should().Contain("[REDACTED_LONG_STRING]");
    }

    [Fact]
    public void SupportBundleRedactor_masks_json_quoted_api_keys_and_inline_assignments()
    {
        const string jsonKey = """{"apiKey":"super-secret-value-here","clientSecret":"also-secret"}""";
        const string inline = "ApiKey=raw-secret-value";

        string redactedJson = SupportBundleRedactor.RedactSensitivePatterns(jsonKey);
        string redactedInline = SupportBundleRedactor.RedactSensitivePatterns(inline);

        redactedJson.Should().Contain("[REDACTED]");
        redactedJson.Should().NotContain("super-secret-value-here");
        redactedInline.Should().Contain("ApiKey=[REDACTED]");
    }

    [Theory]
    [InlineData("Real", "Execution mode: Real")]
    [InlineData("Simulator", "Execution mode: Simulator")]
    [InlineData("Fallback", "Execution mode: Fallback")]
    [InlineData("Mixed", "Execution mode: Mixed")]
    [InlineData(null, "Execution mode not captured")]
    public void PilotProofPacketStructuralExecutionModeFormatter_builds_sponsor_caveat_lines(
        string? modeLabel,
        string expectedFragment)
    {
        string line = PilotProofPacketStructuralExecutionModeFormatter.BuildSponsorCaveatLine(modeLabel);

        line.Should().Contain(expectedFragment);
    }

    [Theory]
    [InlineData("""{"structuralExecutionMode":"Real"}""", "Real")]
    [InlineData("""{"structuralExecutionMode":2}""", "Fallback")]
    [InlineData("""{"other":true}""", null)]
    public void PilotProofPacketStructuralExecutionModeFormatter_resolves_wire_modes(
        string deltasJson,
        string? expectedLabel)
    {
        PilotProofPacketStructuralExecutionModeFormatter.TryResolveLabelFromDeltasJson(deltasJson)
            .Should()
            .Be(expectedLabel);
    }

    [Fact]
    public void PilotProofPacketIndexBuilder_builds_markdown_and_json_with_strict_and_demo_flags()
    {
        string markdown = PilotProofPacketIndexBuilder.BuildMarkdown(
            "run-13",
            pilotStrictSatisfied: false,
            structuralExecutionModeLabel: "Simulator");

        markdown.Should().Contain("run-13");
        markdown.Should().Contain("not satisfied");
        markdown.Should().Contain("Execution mode: Simulator");

        string json = PilotProofPacketIndexBuilder.BuildJson(
            "run-13",
            pilotStrictSatisfied: true,
            demoWarning: true,
            structuralExecutionModeLabel: "Real");

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("runId").GetString().Should().Be("run-13");
        root.GetProperty("pilotStrictSatisfied").GetBoolean().Should().BeTrue();
        root.GetProperty("demoWarning").GetBoolean().Should().BeTrue();
        root.GetProperty("structuralExecutionMode").GetString().Should().Be("Real");
    }

    [Fact]
    public void PilotProofPacketIndexBuilder_rejects_blank_run_id()
    {
        Action markdown = () => PilotProofPacketIndexBuilder.BuildMarkdown(" ", true);
        Action json = () => PilotProofPacketIndexBuilder.BuildJson(" ", false, false);

        markdown.Should().Throw<ArgumentException>();
        json.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void SupportBundleRedactionManifestBuilder_builds_pass_and_not_applied_manifests()
    {
        SupportBundleRedactionManifest pass = SupportBundleRedactionManifestBuilder.Build(true);
        SupportBundleRedactionManifest skipped = SupportBundleRedactionManifestBuilder.Build(false);

        pass.Status.Should().Be("PASS");
        pass.RedactionPassAppliedToSerializedSections.Should().BeTrue();
        pass.RulesApplied.Should().Equal(SupportBundleRedactor.TextPatternRedactionRules);
        pass.ReviewerInstructions.Should().ContainSingle(line => line.Contains("redaction-manifest.json"));

        skipped.Status.Should().Be("NOT_APPLIED");
        skipped.RulesApplied.Should().BeEmpty();
        skipped.SecretDetectionStatus.Should().Contain("NOT_SCANNED");
    }

    [Fact]
    public void SupportBundleRedactionManifestBuilder_attaches_integrity_when_output_directory_exists()
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-redaction-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            File.WriteAllText(Path.Combine(tempDir, SupportBundleArchiveWriter.HealthFileName), """{"status":"Healthy"}""");

            SupportBundleRedactionManifest manifest =
                SupportBundleRedactionManifestBuilder.Build(true, tempDir);

            manifest.FileIntegrity.Should().ContainSingle(entry =>
                entry.FileName == SupportBundleArchiveWriter.HealthFileName && entry.Sha256Hex.Length == 64);
        }
        finally
        {
            try
            {
                Directory.Delete(tempDir, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort cleanup for temp probe directory.
            }
        }
    }

    [Fact]
    public void RealModeSmokeOneLineSummaryFormatter_formats_pass_and_fail_lines()
    {
        RealModeSmokeReport passReport = new()
        {
            AllPassed = true,
            CorrelationId = "corr-1",
            RunId = "run-welcome",
            FinalRunStatus = "Committed",
            TotalLlmTokens = 42,
            Steps = [new RealModeSmokeStepResult { Name = "health", Passed = true }],
        };

        RealModeSmokeReport failReport = new()
        {
            AllPassed = false,
            CorrelationId = "corr-2",
            TotalLlmTokens = 0,
            Steps =
            [
                new RealModeSmokeStepResult { Name = "health", Passed = true },
                new RealModeSmokeStepResult { Name = "commit", Passed = false },
            ],
        };

        string passLine = RealModeSmokeOneLineSummaryFormatter.Format(passReport, "https://host.example");
        string failLine = RealModeSmokeOneLineSummaryFormatter.Format(failReport, "https://host.example");

        passLine.Should().StartWith("PASS ");
        passLine.Should().Contain("correlation=corr-1");
        passLine.Should().Contain("runId=run-welcome");
        passLine.Should().Contain("tokens=42");
        passLine.Should().Contain("failed=<none>");

        failLine.Should().StartWith("FAIL ");
        failLine.Should().Contain("failed=commit");
    }

    [Fact]
    public void RealModeSmokeOneLineSummaryFormatter_rejects_null_inputs()
    {
        Action nullReport = () => RealModeSmokeOneLineSummaryFormatter.Format(null!, "https://host.example");
        Action nullHost = () => RealModeSmokeOneLineSummaryFormatter.Format(new RealModeSmokeReport(), null!);

        nullReport.Should().Throw<ArgumentNullException>();
        nullHost.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ConfigBootstrapDocumentMerger_merges_sql_and_openai_sections()
    {
        ConfigBootstrapAnswers answers = new()
        {
            ConnectionStringsArchLucid = "Server=.;Database=arch;Encrypt=False;TrustServerCertificate=True",
            AzureOpenAiEndpoint = "https://example.openai.azure.com/",
            AzureOpenAiApiKey = "test-key",
            AzureOpenAiDeploymentName = "gpt-4o-mini",
        };

        string merged = ConfigBootstrapDocumentMerger.MergeToIndentedJson(
            """{"Logging":{"LogLevel":{"Default":"Information"}}}""",
            answers);

        merged.Should().Contain("ConnectionStrings");
        merged.Should().Contain("ArchLucid");
        merged.Should().Contain("AzureOpenAI");
        merged.Should().Contain("gpt-4o-mini");
    }

    [Theory]
    [InlineData("http://insecure.example")]
    [InlineData("not-a-url")]
    public void ConfigBootstrapDocumentMerger_validate_https_endpoint_rejects_insecure_or_invalid(string endpoint)
    {
        Action act = () => ConfigBootstrapDocumentMerger.ValidateHttpsResourceEndpoint(endpoint);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void SponsorPacketProvenanceBuilder_reads_audit_and_artifact_arrays()
    {
        string auditJson = """{"auditEventIds":["evt-1","evt-2"]}""";
        string artifactJson = """{"artifactIds":["art-1"]}""";

        string json = SponsorPacketProvenanceBuilder.BuildJson(" run-99 ", auditJson, artifactJson);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("runId").GetString().Should().Be("run-99");
        root.GetProperty("auditEventIds").EnumerateArray().Select(static element => element.GetString()).Should().Equal("evt-1", "evt-2");
        root.GetProperty("artifactIds").EnumerateArray().Select(static element => element.GetString()).Should().Equal("art-1");
    }

    [Fact]
    public void SponsorPacketProvenanceBuilder_tolerates_invalid_json_fragments()
    {
        string json = SponsorPacketProvenanceBuilder.BuildJson("run-1", "{ not json", null);

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("auditEventIds").GetArrayLength().Should().Be(0);
        doc.RootElement.GetProperty("artifactIds").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void PilotProofPacketRedactionManifestBuilder_builds_pass_manifest_json()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: true);

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("status").GetString().Should().Be("PASS");
        doc.RootElement.GetProperty("redactionPassAppliedToProofPacket").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("filesCovered").GetArrayLength().Should().BeGreaterThan(0);
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
}
