using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-091: IDOR integration and unit tests for restricted architecture share enforcement.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs091RestrictedShareIdorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As091_idor_unit_tests_exist_for_restricted_architecture_reads()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "ArchitecturesControllerRestrictedShareIdorTests.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-091");
        source.Should().Contain("GetArchitecture_WhenUnshared_Returns404_Not200");
        source.Should().Contain("ListArchitectures_OmitsRestrictedArchitecture_WhenUnshared");
        source.Should().Contain("GetInventoryBinding_WhenUnshared_Returns404");
        source.Should().Contain("AttachInventoryBinding_WhenUnshared_Returns404");
    }

    [Fact]
    public void As091_sql_idor_integration_tests_exist_for_restricted_architecture()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "Security",
            "RestrictedArchitectureShareIdorIntegrationTests.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("Unshared_user_cannot_get_restricted_architecture_sql");
        source.Should().Contain("Unshared_user_cannot_list_restricted_architecture_title_sql");
        source.Should().Contain("Unshared_user_cannot_get_restricted_run_review_sql");
        source.Should().Contain("Unshared_user_cannot_download_restricted_run_export_sql");
        source.Should().Contain("Unshared_user_cannot_get_restricted_inventory_binding_sql");
    }

    [Fact]
    public void As091_share_access_gate_exists_for_application_layer_enforcement()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "ArchitectureShareAccessGate.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("EnsureArchitectureReadAllowedAsync");
        source.Should().Contain("EnsureRunReadAllowedAsync");
        source.Should().Contain("NotFoundProblem");
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
