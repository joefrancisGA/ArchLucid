using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Support;

[Trait("Suite", "Core")]
public sealed class SupportBundleRedactionManifestBuilderTests
{
    [Fact]
    public void Build_reports_pass_status_when_redaction_pass_applied()
    {
        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: true);

        manifest.Status.Should().Be("PASS");
        manifest.RedactionPassAppliedToSerializedSections.Should().BeTrue();
        manifest.RulesApplied.Should().NotBeEmpty();
        manifest.SecretDetectionStatus.Should().Be("NOT_RECORDED_BY_DESIGN_PATTERN_REDACTION_APPLIED");
        manifest.EvidenceClaim.Should().Contain("redactor");
    }

    [Fact]
    public void Build_reports_not_applied_status_when_redaction_pass_skipped()
    {
        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: false);

        manifest.Status.Should().Be("NOT_APPLIED");
        manifest.RedactionPassAppliedToSerializedSections.Should().BeFalse();
        manifest.RulesApplied.Should().BeEmpty();
        manifest.SecretDetectionStatus.Should().Be("NOT_SCANNED_REDACTION_PASS_NOT_APPLIED");
        manifest.EvidenceClaim.Should().Contain("without the final text-pattern redaction pass");
    }

    [Fact]
    public void Build_includes_omitted_secret_categories_and_reviewer_instructions_regardless_of_status()
    {
        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: false);

        manifest.OmittedSecretBearingCategories.Should().Contain("raw API key values");
        manifest.Limitations.Should().NotBeEmpty();
        manifest.ReviewerInstructions.Should().NotBeEmpty();
    }

    [Fact]
    public void Build_leaves_file_integrity_empty_when_output_directory_is_not_provided()
    {
        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: true,
            outputDirectory: null);

        manifest.FileIntegrity.Should().BeEmpty();
        manifest.FilesCovered.Should().NotBeEmpty();
    }

    [Fact]
    public void Build_leaves_file_integrity_empty_when_output_directory_does_not_exist()
    {
        string missingDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));

        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: true,
            outputDirectory: missingDirectory);

        manifest.FileIntegrity.Should().BeEmpty();
    }

    [Fact]
    public void Build_stamps_generated_utc_as_round_trip_timestamp()
    {
        SupportBundleRedactionManifest manifest = SupportBundleRedactionManifestBuilder.Build(
            redactionPassAppliedToSerializedSections: true);

        DateTimeOffset.TryParse(manifest.GeneratedUtc, out DateTimeOffset parsed).Should().BeTrue();
        parsed.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromMinutes(1));
    }
}
