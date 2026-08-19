using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-004: dual-replica budget reservation must serialize against one SQL row (integration harness).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmBudgetDualReplicaHarnessArchitectureTests
{
    [Fact]
    public void Sql_llm_tenant_budget_concurrency_integration_test_is_present_for_inv_004()
    {
        string path = Path.Combine(
            FindRepoRoot(),
            "ArchLucid.Persistence.Tests",
            "SqlLlmTenantBudgetRepositoryConcurrencyIntegrationTests.cs");

        File.Exists(path).Should().BeTrue(path);

        string text = File.ReadAllText(path, Encoding.UTF8);

        text.Should().Contain("INV-004");
        text.Should().Contain("Concurrent_daily_reserve_serializes_on_hard_cap");
        text.Should().Contain("Task.WhenAll");
    }

    [Fact]
    public void Persistence_tests_project_is_listed_in_solution_for_ci_dual_replica_harness()
    {
        string sln = Path.Combine(FindRepoRoot(), "ArchLucid.sln");
        string text = File.ReadAllText(sln, Encoding.UTF8);

        text.Should().Contain("ArchLucid.Persistence.Tests\\ArchLucid.Persistence.Tests.csproj");
    }

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }
}
