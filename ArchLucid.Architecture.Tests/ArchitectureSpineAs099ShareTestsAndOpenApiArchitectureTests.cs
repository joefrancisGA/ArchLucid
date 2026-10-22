using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-099: OpenAPI share surface and full API test coverage ratchet.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs099ShareTestsAndOpenApiArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As099_openapi_snapshot_documents_share_routes_and_schemas()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "Contracts",
            "openapi-v1.contract.snapshot.json");

        File.Exists(path).Should().BeTrue();

        string snapshot = ArchitectureSourceProbe.ReadPathWithPartials(path);

        snapshot.Should().Contain("/v1/architectures/{architectureId}/shares");
        snapshot.Should().Contain("/v1/architectures/{architectureId}/shares/{targetActorOid}");
        snapshot.Should().Contain("/v1/architectures/{architectureId}/restrict-to-shares");
        snapshot.Should().Contain("ArchitectureShareListResponse");
        snapshot.Should().Contain("PutArchitectureShareRequest");
        snapshot.Should().Contain("PatchArchitectureRestrictToSharesRequest");
    }

    [Fact]
    public void As099_openapi_invariants_cover_architecture_share_endpoints()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "OpenApiContractInvariantsTests.cs");

        File.Exists(path).Should().BeTrue();

        string source = ArchitectureSourceProbe.ReadPathWithPartials(path);

        source.Should().Contain("OpenApi_v1_json_documents_architecture_share_crud_and_restrict_flag");
        source.Should().Contain("ArchitectureShareListResponse");
        source.Should().Contain("PatchArchitectureRestrictToSharesRequest");
    }

    [Fact]
    public void As099_api_tests_cover_grant_revoke_restrict_idor_empty_restrict_and_audit()
    {
        string sharesTests = Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "ArchitecturesControllerSharesTests.cs");
        string restrictTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "ArchitecturesControllerRestrictToSharesTests.cs");
        string idorUnitTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "ArchitecturesControllerRestrictedShareIdorTests.cs");
        string idorIntegrationTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "Security",
            "RestrictedArchitectureShareIdorIntegrationTests.cs");

        ArchitectureSourceProbe.ReadPathWithPartials(sharesTests).Should().Contain("ListShares_ReturnsSharePayload");
        ArchitectureSourceProbe.ReadPathWithPartials(sharesTests).Should().Contain("UpsertShare_WithAdmin_Returns204");
        ArchitectureSourceProbe.ReadPathWithPartials(sharesTests).Should().Contain("DeleteShare_WhenMissing_Returns404");
        ArchitectureSourceProbe.ReadPathWithPartials(restrictTests).Should().Contain("SetRestrictToShares_EnableWithConfirm_AutoInsertsActorAdminShare");
        ArchitectureSourceProbe.ReadPathWithPartials(idorUnitTests).Should().Contain("GetArchitecture_WhenUnshared_Returns404_Not200");
        ArchitectureSourceProbe.ReadPathWithPartials(idorIntegrationTests).Should().Contain("Unshared_user_cannot_get_restricted_architecture_sql");
    }

    [Fact]
    public void As099_ui_share_client_uses_generated_openapi_types()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "api",
            "architecture-share-api.ts");

        File.Exists(path).Should().BeTrue();

        string source = ArchitectureSourceProbe.ReadPathWithPartials(path);

        source.Should().Contain("schemas.generated");
        source.Should().Contain("ArchitectureShareListResponse");

        string contractTest = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "architecture-spine",
            "architecture-share-api-contract.test.ts");

        File.Exists(contractTest).Should().BeTrue();
        ArchitectureSourceProbe.ReadPathWithPartials(contractTest).Should().Contain("AS-099");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
