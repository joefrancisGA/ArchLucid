using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Support;
using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch9Tests
{
    [Fact]
    public void SponsorPacketManifestBuilder_builds_sorted_sha256_manifest_excluding_pack_manifest()
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-sponsor-manifest-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);

        try
        {
            byte[] alphaBytes = "alpha-content"u8.ToArray();
            byte[] betaBytes = "beta-content"u8.ToArray();
            File.WriteAllBytes(Path.Combine(tempDir, "beta.json"), betaBytes);
            File.WriteAllBytes(Path.Combine(tempDir, "alpha.json"), alphaBytes);
            File.WriteAllText(Path.Combine(tempDir, SponsorPacketArtifactCatalog.PackManifestFileName), """{"ignored":true}""");

            string json = SponsorPacketManifestBuilder.BuildJson(" run-42 ", demoDataWarning: true, tempDir);

            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            root.GetProperty("formatVersion").GetString().Should().Be(SponsorPacketArtifactCatalog.FormatVersion);
            root.GetProperty("runId").GetString().Should().Be("run-42");
            root.GetProperty("demoDataWarning").GetBoolean().Should().BeTrue();

            JsonElement[] files = root.GetProperty("files").EnumerateArray().ToArray();
            files.Should().HaveCount(2);
            files[0].GetProperty("path").GetString().Should().Be("alpha.json");
            files[1].GetProperty("path").GetString().Should().Be("beta.json");
            files[0].GetProperty("sizeBytes").GetInt32().Should().Be(alphaBytes.Length);
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
    public void SponsorPacketManifestBuilder_rejects_missing_directory_and_blank_inputs()
    {
        Action blankRunId = () => SponsorPacketManifestBuilder.BuildJson(" ", false, Path.GetTempPath());
        Action blankDirectory = () => SponsorPacketManifestBuilder.BuildJson("run-1", false, " ");
        Action missingDirectory = () => SponsorPacketManifestBuilder.BuildJson("run-1", false, Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N")));

        blankRunId.Should().Throw<ArgumentException>();
        blankDirectory.Should().Throw<ArgumentException>();
        missingDirectory.Should().Throw<DirectoryNotFoundException>();
    }

    [Theory]
    [InlineData(new[] { "--json", "health" }, true, new[] { "health" })]
    [InlineData(new[] { "--json", "--json", "version" }, true, new[] { "version" })]
    [InlineData(new[] { "doctor" }, false, new[] { "doctor" })]
    public void CliExecutionContext_stripLeadingGlobalJsonFlags_removes_prefix_flags(string[] args, bool json, string[] expected)
    {
        string[] stripped = CliExecutionContext.StripLeadingGlobalJsonFlags(args, out bool parsedJson);

        parsedJson.Should().Be(json);
        stripped.Should().Equal(expected);
    }

    [Theory]
    [InlineData(null, TeamStripeCheckoutPreflightClassifier.NotConfigured)]
    [InlineData("https://example.com/cs_test_abc", TeamStripeCheckoutPreflightClassifier.TestMode)]
    [InlineData("https://checkout.stripe.com/pay/cs_live_abc", TeamStripeCheckoutPreflightClassifier.LiveCandidate)]
    [InlineData("https://buy.stripe.com/checkout-placeholder", TeamStripeCheckoutPreflightClassifier.Placeholder)]
    public void TeamStripeCheckoutPreflightClassifier_classifies_additional_url_shapes(string? rawUrl, string expected)
    {
        TeamStripeCheckoutPreflightClassifier.Classify(rawUrl).Should().Be(expected);
    }

    [Fact]
    public void SupportBundleReadme_includes_next_steps_and_correlation_guidance()
    {
        SupportBundleNextStepsDocument nextSteps = new()
        {
            SummaryLines = ["Verify /health/ready", "Capture correlation id from failing API call"],
        };

        string readme = SupportBundleReadme.Build(
            "2026-07-23T00:00:00Z",
            "https://api.example",
            @"C:\projects\demo",
            nextSteps);

        readme.Should().Contain("Suggested next steps");
        readme.Should().Contain("Verify /health/ready");
        readme.Should().Contain("X-Correlation-ID");
        readme.Should().Contain(SupportBundleArchiveWriter.HealthFileName);

        Action nullNextSteps = () => SupportBundleReadme.Build("utc", "url", "cwd", null!);
        nullNextSteps.Should().Throw<ArgumentNullException>();
    }
}
