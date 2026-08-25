using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

using System.Text.Json;

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
    public void TryValidateDeltasJson_accepts_default_serialized_pilot_run_deltas_response()
    {
        PilotRunDeltasResponse response = new()
        {
            IsDemoTenant = false,
            ProofPackageCompleteness = new ProofPackageCompletenessResponse { RunInCommittedStatus = true },
        };

        string json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out _, out string? error);

        ok.Should().BeTrue(error);
    }
}
