using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsSampleRunNumberDoubleSnakeCaseTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_sample_run_when_is_sample_run_whole_number_double_one()
    {
        string json =
            """
            {"is_demo_tenant":false,"is_sample_run":1.0,"structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }

    [Fact]
    public void ResolveFromDeltasJson_blocks_sample_run_when_is_demo_tenant_whole_number_double_one()
    {
        string json =
            """
            {"is_demo_tenant":1.0,"is_sample_run":false,"structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
