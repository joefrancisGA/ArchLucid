using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-086 ratchet: ADR 0087 optional RestrictToShares inside tenant.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs086ArchitectureShareAclArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0087-architecture-share-acl-inside-tenant.md";

    [Fact]
    public void As086_adr_0087_exists_and_documents_restrict_to_shares()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("RestrictToShares");
        adr.Should().Contain("ADR 0037");
        adr.Should().NotContain("finding-comment chat");
        adr.Should().Contain("no SQL RLS");
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
