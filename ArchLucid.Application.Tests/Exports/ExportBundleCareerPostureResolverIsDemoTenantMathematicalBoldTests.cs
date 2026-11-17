using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsDemoTenantMathematicalBoldTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_demo_tenant_when_is_demo_tenant_string_uses_mathematical_bold_true()
    {
        const string deltasJson = """
            {"is_demo_tenant":"\uD835\uDC2D\uD835\uDC2B\uD835\uDC2E\uD835\uDC1E","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }
}
