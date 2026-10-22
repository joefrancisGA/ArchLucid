using ArchLucid.Application.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverStructuralExecutionModePascalCaseTests
{
    [Fact]
    public void ResolveFromDeltasJson_allows_career_when_structural_execution_mode_pascal_case_real()
    {
        const string deltasJson = """
            {"StructuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(deltasJson);

        result.IsBlocked.Should().BeFalse();
        result.Stamp!.CareerPosture.Should().Be(ExportBundleCareerPostureResolver.CareerPostureCareer);
    }
}
