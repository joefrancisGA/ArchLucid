using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsSampleRunStringTrueUppercaseTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_sample_run_when_is_sample_run_camel_case_string_true_uppercase()
    {
        const string deltasJson =
            """
            {"isSampleRun":"TRUE","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
