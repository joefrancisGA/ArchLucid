using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-095: consistent 404 policy for hidden restricted architectures (ADR 0087).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs095ApiHiddenArchitecture404ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As095_not_visible_helper_exists_for_architecture_and_run_ids()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api",
            "Support",
            "ArchitectureShareNotVisibleAsNotFoundResponsePolicy.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-095");
        source.Should().Contain("ArchitectureNotFound");
        source.Should().Contain("RunNotFound");
        source.Should().Contain("404");
    }

    [Fact]
    public void As095_share_access_gate_uses_not_visible_helper()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "ArchitectureShareAccessGate.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("ArchitectureShareNotVisibleAsNotFoundResponsePolicy");
        source.Should().NotContain("ForbiddenProblem");
    }

    [Fact]
    public void As095_unit_tests_cover_architecture_and_run_404_policy()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "ArchitectureShareAccessGateNotFoundPolicyTests.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("EnsureArchitectureReadAllowed_when_unshared_restricted_returns_404_not_403");
        source.Should().Contain("EnsureRunReadAllowed_when_unshared_restricted_returns_404_not_403");
    }

    [Fact]
    public void As095_sql_idor_integration_requires_404_not_403()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "Security",
            "RestrictedArchitectureShareIdorIntegrationTests.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-095");
        source.Should().Contain("HttpStatusCode.NotFound");
        source.Should().NotContain("HttpStatusCode.Forbidden");
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
