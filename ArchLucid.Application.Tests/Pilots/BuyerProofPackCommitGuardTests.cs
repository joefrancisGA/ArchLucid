using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

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
}
