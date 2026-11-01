using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsDemoTenantPhoneticSmallCapsTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_demo_tenant_when_is_demo_tenant_string_uses_phonetic_small_caps_true()
    {
        const string deltasJson = """
            {"is_demo_tenant":"\u1D1B\u0280\u1D1C\u1D07","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage);
    }

    [Fact]
    public void ResolveFromDeltasJson_does_not_block_when_is_demo_tenant_string_uses_phonetic_small_caps_false()
    {
        const string deltasJson = """
            {"is_demo_tenant":"\u1D08\u1D00\u1D0B\u1D18\u1D07","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeFalse();
    }
}
