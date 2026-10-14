using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Manifest.Builders;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Manifest;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CostManifestSectionPopulatorTests
{
    [Fact]
    public void Populate_uses_honesty_copy_when_budget_and_cap_are_missing()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Findings =
            [
                new Finding
                {
                    FindingId = "cost-1",
                    FindingType = FindingTypes.CostConstraintFinding,
                    Payload = """{"costRisk":"medium"}""",
                },
            ],
        };

        ManifestDocument manifest = new() { ManifestId = Guid.NewGuid(), RunId = Guid.NewGuid() };
        CostManifestSectionPopulator populator = new();

        populator.Populate(manifest, new FindingsSnapshotTypeIndex(snapshot));

        manifest.Assumptions.Should().ContainSingle(line =>
            line.Contains("Budget name was not stored.", StringComparison.Ordinal)
            && line.Contains("Monthly cap was not stored.", StringComparison.Ordinal));
        manifest.Assumptions.Should().NotContain(line => line.Contains("default", StringComparison.OrdinalIgnoreCase));
        manifest.Assumptions.Should().NotContain(line => line.Contains("unspecified", StringComparison.OrdinalIgnoreCase));
    }
}
