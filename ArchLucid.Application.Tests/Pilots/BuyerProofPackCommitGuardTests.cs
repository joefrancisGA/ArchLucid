using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuyerProofPackCommitGuardTests
{
    [Fact]
    public void TryValidateCommitted_when_committed_manifest_returns_true()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { Status = ArchitectureRunStatus.Committed },
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "v1" } },
        };

        bool ok = BuyerProofPackCommitGuard.TryValidateCommitted(detail, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public void TryValidateDeltasJson_when_not_committed_returns_false()
    {
        const string json = """{"proofPackageCompleteness":{"runInCommittedStatus":false}}""";

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryValidateCommitted_when_ready_for_commit_with_manifest_returns_false()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { Status = ArchitectureRunStatus.ReadyForCommit },
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "v1" } },
        };

        bool ok = BuyerProofPackCommitGuard.TryValidateCommitted(detail, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("Committed");
    }

    [Fact]
    public void TryValidateCommitted_when_committed_without_manifest_returns_false()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { Status = ArchitectureRunStatus.Committed },
            Manifest = null,
        };

        bool ok = BuyerProofPackCommitGuard.TryValidateCommitted(detail, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("manifest");
    }

    [Fact]
    public void TryValidateDeltasJson_when_proof_package_completeness_missing_returns_false()
    {
        const string json = """{"isDemoTenant":false}""";

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("proofPackageCompleteness");
    }

    [Fact]
    public void TryValidateDeltasJson_when_committed_sets_demo_warning_from_is_demo_tenant()
    {
        const string json = """{"isDemoTenant":true,"proofPackageCompleteness":{"runInCommittedStatus":true}}""";

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out bool demoWarning, out string? error);

        ok.Should().BeTrue();
        demoWarning.Should().BeTrue();
        error.Should().BeNull();
    }
}
