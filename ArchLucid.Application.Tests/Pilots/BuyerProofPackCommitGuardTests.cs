using System.Text.Json;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

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
    public void TryValidateDeltasJson_when_pascal_case_property_names_fails()
    {
        PilotRunDeltasResponse response = new()
        {
            IsDemoTenant = false,
            ProofPackageCompleteness = new ProofPackageCompletenessResponse { RunInCommittedStatus = true },
        };

        string pascalJson = JsonSerializer.Serialize(response);

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(pascalJson, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("proofPackageCompleteness");
    }

    [Fact]
    public void TryValidateDeltasJson_when_camel_case_contract_json_passes()
    {
        PilotRunDeltasResponse response = new()
        {
            IsDemoTenant = false,
            ProofPackageCompleteness = new ProofPackageCompletenessResponse { RunInCommittedStatus = true },
        };

        string camelJson = JsonSerializer.Serialize(response, ContractJson.CamelCaseIgnoreNullCompact);

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(camelJson, out bool demoWarning, out string? error);

        ok.Should().BeTrue();
        demoWarning.Should().BeFalse();
        error.Should().BeNull();
    }
}
