using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     AS-046: architecture inventory binding contract exists and forbids a second Azure collector fork.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryBindingContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ContractRelativePath = "docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md";

    [Fact]
    public void As046_contract_file_exists_and_documents_bind_unbind_and_observed_fact_merge()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        File.Exists(path).Should().BeTrue();

        string contract = File.ReadAllText(path);

        contract.Should().Contain("ArchitectureInventoryBinding");
        contract.Should().Contain("AzureInventorySnapshot");
        contract.Should().Contain("ObservedFact");
        contract.Should().Contain("bind");
        contract.Should().Contain("unbind");
        contract.Should().Contain("estate gap");
        contract.Should().Contain("INFRA_EVIDENCE_PLANE.md");
        contract.Should().Contain("ADR 0084");
    }

    [Fact]
    public void As046_contract_forbids_second_arm_collector_fork()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        string contract = File.ReadAllText(path);

        contract.Should().Contain("Get-ArchLucidAzurePackage.ps1");
        contract.Should().Contain("HostedAzureExtractorClient");
        contract.Should().MatchRegex("second Azure collector|no second collector|One collector family", "contract must explicitly forbid a second collector");
        contract.Should().Contain("IAzureInventorySnapshotRepository");
    }

    [Fact]
    public void As046_contract_keeps_three_finding_streams_distinct()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        string contract = File.ReadAllText(path);

        contract.Should().Contain("FindingsSnapshot");
        contract.Should().Contain("OperationalSecurityFinding");
        contract.Should().MatchRegex("three finding streams|Three finding streams");
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
