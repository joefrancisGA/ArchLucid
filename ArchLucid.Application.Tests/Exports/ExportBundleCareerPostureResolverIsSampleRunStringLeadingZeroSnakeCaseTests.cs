using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsSampleRunStringLeadingZeroSnakeCaseTests
{
    [Theory]
    [InlineData("01")]
    [InlineData("1.00")]
    public void ResolveFromDeltasJson_blocks_when_is_sample_run_string_coerces_to_non_zero(string sampleRunValue)
    {
        string deltasJson =
            "{\"is_demo_tenant\":false,\"is_sample_run\":\"" + sampleRunValue
            + "\",\"structuralExecutionMode\":\"Real\",\"workingCareerRehearsalDoor\":\"career\",\"proofPackageCompleteness\":{\"runInCommittedStatus\":true}}";

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
