using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsSampleRunGreekHomoglyphTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_sample_workspace_run_when_is_sample_run_string_uses_greek_epsilon_homoglyph()
    {
        const string deltasJson = """
            {"isDemoTenant":false,"isSampleRun":"tru\u03B5","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
