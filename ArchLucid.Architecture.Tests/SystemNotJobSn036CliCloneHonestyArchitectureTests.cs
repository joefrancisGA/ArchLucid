using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-036 ratchet: CLI clone-snapshot prints Career/Rehearsal honesty and blocks unlabeled Simulator Career narrative.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn036CliCloneHonestyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn036_honesty_module_names_cg_062_cg_021_and_lw_cas_reminder()
    {
        string honesty = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "DraftCloneSnapshotHonesty.cs"));

        honesty.Should().Contain("CG-062");
        honesty.Should().Contain("CG-021");
        honesty.Should().Contain("ExpectedUpdatedUtc");
        honesty.Should().Contain("SN-036");
        honesty.Should().Contain("WriteStdoutBannerAsync");
    }

    [Fact]
    public void Sn036_command_wires_clone_snapshot_api_and_stdout_banner()
    {
        string command = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "DraftCloneSnapshotCommand.cs"));
        string api = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "ArchLucidCliApiClient.Drafts.cs"));

        command.Should().Contain("CloneDraftSnapshotAsync");
        command.Should().Contain("WriteStdoutBannerAsync");
        command.Should().NotContain("PatchDraftAsync");
        api.Should().Contain("CloneDraftSnapshotAsync");
        api.Should().Contain("clone-snapshot");
    }

    [Fact]
    public void Sn036_cli_tests_cover_honesty_stdout_and_clone_success()
    {
        string tests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli.Tests", "DraftCloneSnapshotCommandTests.cs"));

        tests.Should().Contain("SN-036");
        tests.Should().Contain("Career/Rehearsal");
        tests.Should().Contain("CG-021");
        tests.Should().Contain("CloneDraftId");
    }

    [Fact]
    public void Sn036_vitest_ratchet_names_cli_inventory_and_cas_patch_reminder()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-cli-clone-honesty.ts"));
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-cli-clone-honesty.test.ts"));

        module.Should().Contain("SN-036");
        module.Should().Contain("DraftCloneSnapshotHonesty.cs");
        test.Should().Contain("ExpectedUpdatedUtc");
        test.Should().Contain("clone-snapshot");
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
