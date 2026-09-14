using ArchLucid.Application.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class ExportBundleCareerPostureResolverIsDemoTenantStringTSnakeCaseTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_demo_tenant_when_is_demo_tenant_snake_case_string_t()
    {
        const string json =
            """
            {"is_demo_tenant":"t","structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeTrue();
    }
}
