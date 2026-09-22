using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-086 ratchet: ADR 0087 optional restrict-to-shares inside the tenant.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs086ArchitectureShareAclArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0087-architecture-scoped-sharing-restrict-to-shares.md";

    private const string ReadmeRelativePath = "docs/architecture/adrs/README.md";

    [Fact]
    public void As086_adr_0087_exists_with_restrict_to_shares_and_required_sections()
    {
        string adrPath = Path.Combine(RepoRoot, AdrRelativePath);
        File.Exists(adrPath).Should().BeTrue();

        string adr = File.ReadAllText(adrPath);

        adr.Should().Contain("**Status:** Proposed");
        adr.Should().Contain("RestrictToShares");
        adr.Should().Contain("View");
        adr.Should().Contain("Decide");
        adr.Should().Contain("Admin");
        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("0037");
        adr.Should().Contain("0074");
    }

    [Fact]
    public void As086_adr_0087_amends_no_per_architecture_acl_to_optional_restrict()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("No per-architecture ACL in V1");
        adr.Should().Contain("optional restrict-to-shares");
        adr.Should().Contain("Quoteable amend (ADR 0074)");
        adr.Should().Contain("**Amends:** ADR **0074**");
    }

    [Fact]
    public void As086_adr_0087_forbids_sql_rls_chat_and_presence()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("No SQL RLS");
        adr.Should().Contain("finding-comment chat");
        adr.Should().Contain("live presence");
        adr.Should().Contain("second tenant");
        adr.Should().NotContain("add `rls.");
    }

    [Fact]
    public void As086_adr_0087_documents_idor_and_404_policy()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("IDOR");
        adr.Should().Contain("404 Not Found");
        adr.Should().Contain("AS-095");
        adr.Should().Contain("Required durable audit");
    }

    [Fact]
    public void As086_readme_lists_adr_0087_row()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, ReadmeRelativePath));

        readme.Should().Contain("0087-architecture-scoped-sharing-restrict-to-shares.md");
        readme.Should().Contain("AS-086");
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
