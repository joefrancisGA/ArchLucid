using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// QR-16 ratchet: OpenAPI v1 snapshot, contract tests, and inventory-binding wire exist.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class V10QualityRoiQr16ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Qr016_openapi_snapshot_contract_and_v10_ratchet_exist()
    {
        string snapshot = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api.Tests",
                "Contracts",
                "openapi-v1.contract.snapshot.json"));
        string contractTests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "OpenApiContractSnapshotTests.cs"));
        string regenScript = File.ReadAllText(
            Path.Combine(RepoRoot, "scripts", "ci", "update_openapi_contract_snapshot.sh"));
        string ratchet = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "v10-quality-roi-qr16-ratchet.test.ts"));

        snapshot.Should().Contain("/v1/architectures/{architectureId}/inventory-binding");
        snapshot.Should().Contain("AttachArchitectureInventoryBindingRequest");

        contractTests.Should().Contain("OpenApi_v1_json_is_backward_compatible_with_committed_snapshot");

        regenScript.Should().Contain("ARCHLUCID_REGENERATE_UI_API_TYPES");

        ratchet.Should().Contain("QR-16");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
