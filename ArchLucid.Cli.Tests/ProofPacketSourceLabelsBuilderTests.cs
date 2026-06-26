using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProofPacketSourceLabelsBuilderTests
{
    [Fact]
    public void Build_includes_run_id_and_data_policy_lines()
    {
        string text = ProofPacketSourceLabelsBuilder.Build(
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            new DateTimeOffset(2026, 6, 26, 12, 0, 0, TimeSpan.Zero));

        text.Should().Contain("RunId: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        text.Should().Contain("source labels");
        text.Should().Contain("pilot-run-deltas");
        text.Should().Contain("RoiMetricSourceKind");
        text.Should().Contain("limitations.md");
    }

    [Fact]
    public void FileName_is_stable_for_zip_consumers()
    {
        ProofPacketSourceLabelsBuilder.FileName.Should().Be("SOURCE-LABELS.txt");
    }
}
