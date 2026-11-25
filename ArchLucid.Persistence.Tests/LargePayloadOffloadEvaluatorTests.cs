namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LargePayloadOffloadEvaluatorTests
{
    [SkippableFact]
    public void ShouldOffloadManifestOrBundle_false_when_disabled()
    {
        ArtifactLargePayloadOptions o = new()
        {
            Enabled = false, MinimumUtf16LengthToOffload = 1, BlobProvider = "Local"
        };

        LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(o, 999_999).Should().BeFalse();
    }

    [SkippableFact]
    public void ShouldOffloadManifestOrBundle_false_when_provider_none()
    {
        ArtifactLargePayloadOptions o = new()
        {
            Enabled = true, MinimumUtf16LengthToOffload = 10, BlobProvider = "None"
        };

        LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(o, 100).Should().BeFalse();
    }

    [Theory]
    [InlineData(9, false, false)]
    [InlineData(10, true, false)]
    [InlineData(29, true, false)]
    [InlineData(30, true, true)]
    [InlineData(31, true, true)]
    public void Distinct_manifest_and_artifact_thresholds_are_applied_independently(
        int length, bool manifestExpected, bool artifactExpected)
    {
        ArtifactLargePayloadOptions options = new()
        {
            Enabled = true,
            MinimumUtf16LengthToOffload = 10,
            MinimumArtifactContentUtf16LengthToOffload = 30,
            BlobProvider = "Local"
        };

        LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(options, length).Should().Be(manifestExpected);
        LargePayloadOffloadEvaluator.ShouldOffloadArtifactContent(options, length).Should().Be(artifactExpected);
    }

    [Theory]
    [InlineData(false, "Local")]
    [InlineData(true, "nOnE")]
    public void Artifact_content_does_not_offload_when_disabled_or_provider_none(bool enabled, string provider)
    {
        ArtifactLargePayloadOptions options = new()
        {
            Enabled = enabled, MinimumArtifactContentUtf16LengthToOffload = 1, BlobProvider = provider
        };
        LargePayloadOffloadEvaluator.ShouldOffloadArtifactContent(options, 100).Should().BeFalse();
    }

    [SkippableFact]
    public void ShouldOffloadManifestOrBundle_true_when_over_threshold_and_local()
    {
        ArtifactLargePayloadOptions o = new()
        {
            Enabled = true, MinimumUtf16LengthToOffload = 10, BlobProvider = "Local"
        };

        LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(o, 10).Should().BeTrue();
    }
}
