using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-034 ratchet: DraftRequests and Runs stay two kernels/tables (ADR 0068); Compare API remains run-based.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn034NoMergeKernelsRatchetArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn034_ratchet_module_names_acceptance_line_and_kernel_inventory()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-no-merge-kernels-ratchet.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE");
        module.Should().Contain("ADR 0068");
        module.Should().Contain("SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES");
        module.Should().Contain("SYSTEM_NOT_JOB_KERNEL_REPOSITORY_INTERFACES");
        module.Should().Contain("SN-034");
    }

    [Fact]
    public void Sn034_master_sql_keeps_draft_requests_and_runs_separate()
    {
        string sql = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql"));

        sql.Should().Contain("CREATE TABLE dbo.DraftRequests");
        sql.Should().Contain("CREATE TABLE dbo.Runs");
        sql.Should().NotContain("CREATE TABLE dbo.UnifiedDraftRun");
        sql.Should().NotContain("CREATE TABLE dbo.MergedKernel");
    }

    [Fact]
    public void Sn034_compare_service_stays_run_based_not_draft_based()
    {
        string compareService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Coordination",
                "Compare",
                "AuthorityCompareService.cs"));

        compareService.Should().Contain("CompareRunsAsync");
        compareService.Should().Contain("leftRunId");
        compareService.Should().Contain("rightRunId");
        compareService.Should().NotContain("DraftRequest");
    }

    [Fact]
    public void Sn034_vitest_ratchet_names_acceptance_line_adr_0068_and_compare_api_run_ids()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-no-merge-kernels-ratchet.test.ts"));
        string adr0068 = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "docs",
                "architecture",
                "adrs",
                "0068-architecture-synthesis-and-review-evaluation-kernels.md"));

        test.Should().Contain("SN-034");
        test.Should().Contain("explicit acceptance line for close audit");
        test.Should().Contain("compare API modules use run id query params only");
        test.Should().Contain("isSystemNotJobHonestCompareApiQueryParam");
        adr0068.Should().Contain("two kernels");
        adr0068.Should().Contain("DraftRequests");
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
