using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-096: V1 architecture shares target users only — SCIM groups rejected.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs096UsersFirstNotScimGroupsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As096_grant_target_validator_rejects_scim_groups()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Architecture",
            "ArchitectureShareGrantTargetValidator.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-096");
        source.Should().Contain("ScimGroupNotSupported");
    }

    [Fact]
    public void As096_share_contract_documents_users_only_principals()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "ARCHITECTURE_SHARE_ACL_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-096");
        source.Should().Contain("SCIM groups are **not** share targets");
    }

    [Fact]
    public void As096_api_returns_400_for_scim_group_share_target()
    {
        string controller = Path.Combine(
            RepoRoot,
            "ArchLucid.Api",
            "Controllers",
            "Architecture",
            "ArchitecturesController.Shares.cs");
        string controllerTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "ArchitecturesControllerSharesTests.cs");

        File.ReadAllText(controller).Should().Contain("ScimGroupNotSupported");
        File.ReadAllText(controllerTests).Should().Contain("UpsertShare_WithScimGroupId_Returns400");
    }

    [Fact]
    public void As096_ui_share_copy_states_users_only_picker()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "architecture",
            "architecture-share-copy.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("SCIM groups are not supported");
        source.Should().Contain("ARCHITECTURE_IDENTITY_DESK_SHARE_USERS_ONLY_HELPER");
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
