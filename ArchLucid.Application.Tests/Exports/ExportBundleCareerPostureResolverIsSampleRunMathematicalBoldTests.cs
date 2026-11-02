using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsSampleRunMathematicalBoldTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_sample_workspace_run_when_is_sample_run_string_uses_mathematical_bold_true()
    {
        const string deltasJson = """
            {"is_demo_tenant":false,"is_sample_run":"\uD835\uDC2D\uD835\uDC2B\uD835\uDC2E\uD835\uDC1E","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
