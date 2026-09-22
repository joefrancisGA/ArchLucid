using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-009 ratchet: R12 what-if branch cap chrome on clone confirm — not the LLM budget pill.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn009WhatIfCostCapChromeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn009_cost_cap_module_names_r12_cap_and_budget_pill_exclusion()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-what-if-cost-cap-chrome.ts"));

        module.Should().Contain("resolveDraftBranchWhatIfCostCapChrome");
        module.Should().Contain("SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL");
        module.Should().Contain("not the shell AI budget pill");
        module.Should().Contain("confirmDisabled");
        module.Should().NotContain("llm-budget-status-pill");
    }

    [Fact]
    public void Sn009_clone_confirm_dialog_wires_cost_cap_chrome()
    {
        string confirmDialog = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureDraftCloneSnapshotConfirmDialog.tsx"));

        confirmDialog.Should().Contain("ArchitectureWhatIfCostCapChrome");
        confirmDialog.Should().Contain("resolveDraftBranchWhatIfCostCapChrome");
        confirmDialog.Should().Contain("confirmDisabled={capChrome.confirmDisabled}");
    }

    [Fact]
    public void Sn009_vitest_ratchet_names_over_cap_blocking()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-what-if-cost-cap-chrome.test.ts"));

        test.Should().Contain("SN-009");
        test.Should().Contain("TB-2005");
        test.Should().Contain("over cap");
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

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
