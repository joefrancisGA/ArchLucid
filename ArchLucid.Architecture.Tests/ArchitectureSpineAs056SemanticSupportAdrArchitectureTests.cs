using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-056 ratchet: ADR 0085 semantic support band contract exists and forbids commit-gate overclaims.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs056SemanticSupportAdrArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

    private const string ReadmeRelativePath = "docs/architecture/adrs/README.md";

    [Fact]
    public void As056_adr_0085_exists_with_support_bands_and_tb1228_lane_split()
    {
        string adrPath = Path.Combine(RepoRoot, AdrRelativePath);
        File.Exists(adrPath).Should().BeTrue();

        string adr = File.ReadAllText(adrPath);

        adr.Should().Contain("**Status:** Proposed");
        adr.Should().Contain("Supported");
        adr.Should().Contain("Unchecked");
        adr.Should().Contain("Unsupported");
        adr.Should().Contain("NotScored");
        adr.Should().Contain("TB-1228");
        adr.Should().Contain("0082");
        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
    }

    [Fact]
    public void As056_adr_0085_does_not_claim_semantic_legal_truth_or_rag_commit_gate()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().MatchRegex("not.*legal truth", "ADR must disclaim semantic = legal truth");
        adr.Should().MatchRegex("not.*commit gate", "ADR must disclaim RAG/LLM faithfulness as default commit gate");
        adr.Should().Contain("may we block seal on LLM faithfulness");
        adr.Should().Contain("**No**");
        adr.Should().MatchRegex("warn", "default finalize should warn on Unchecked");
        adr.Should().Contain("insight-density");
        adr.Should().MatchRegex("not.*fused", "support band must not fuse into insight-density demotion");
    }

    [Fact]
    public void As056_readme_lists_adr_0085_row()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, ReadmeRelativePath));

        readme.Should().Contain("0085-semantic-support-band-working-career-not-commit-gate.md");
        readme.Should().Contain("AS-056");
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
