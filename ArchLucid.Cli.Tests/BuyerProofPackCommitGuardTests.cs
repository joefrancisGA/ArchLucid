using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerProofPackCommitGuardTests
{
    [Fact]
    public void TryValidate_committed_run_ok()
    {
        const string json = """
                             {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":true}}
                             """;

        bool ok = BuyerProofPackCommitGuard.TryValidate(json, out bool demo, out string? err);

        ok.Should().BeTrue();
        demo.Should().BeFalse();
        err.Should().BeNull();
    }

    [Fact]
    public void TryValidate_uncommitted_fails()
    {
        const string json = """
                             {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":false}}
                             """;

        bool ok = BuyerProofPackCommitGuard.TryValidate(json, out _, out string? err);

        ok.Should().BeFalse();
        err.Should().NotBeNull();
        err!.Should().Contain("committed");
    }

    [Fact]
    public void TryValidate_demo_flag_surfaces()
    {
        const string json = """
                             {"isDemoTenant":true,"proofPackageCompleteness":{"runInCommittedStatus":true}}
                             """;

        BuyerProofPackCommitGuard.TryValidate(json, out bool demo, out _).Should().BeTrue();
        demo.Should().BeTrue();
    }
}
