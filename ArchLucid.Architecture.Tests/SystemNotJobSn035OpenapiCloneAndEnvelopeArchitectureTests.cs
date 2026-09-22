using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-035 ratchet: clone/envelope spawn OpenAPI contract — no new wire fields; snapshot already documents paths.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn035OpenapiCloneAndEnvelopeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn035_ratchet_module_documents_no_wire_change_line()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-openapi-clone-and-envelope.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_NO_WIRE_CHANGE_LINE");
        module.Should().Contain("BranchDraftRequest");
        module.Should().Contain("clone-snapshot");
        module.Should().Contain("SN-035");
    }

    [Fact]
    public void Sn035_openapi_snapshot_documents_clone_snapshot_and_branch_paths()
    {
        string snapshot = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "Contracts", "openapi-v1.contract.snapshot.json"));

        snapshot.Should().Contain("/v1/architecture/draft/{draftId}/clone-snapshot");
        snapshot.Should().Contain("/v1/architecture/draft/{draftId}/branch");
        snapshot.Should().Contain("CloneSnapshotDraftResponse");
        snapshot.Should().Contain("BranchDraftRequest");
        snapshot.Should().Contain("BranchDraftResponse");
        snapshot.Should().Contain("DraftBranchOverrideKind");
    }

    [Fact]
    public void Sn035_clone_snapshot_controller_has_no_request_body_door_or_invariant_fields()
    {
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.CloneSnapshot.cs"));
        string branchController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.Branch.cs"));

        controller.Should().Contain("CloneDraftSnapshot");
        controller.Should().NotContain("[FromBody]");
        controller.Should().NotContain("workingCareerRehearsalDoor");
        branchController.Should().Contain("BranchDraftRequest");
        branchController.Should().Contain("OverrideKind");
    }

    [Fact]
    public void Sn035_vitest_ratchet_names_no_wire_change_and_forbids_draft_compare_api()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-openapi-clone-and-envelope.test.ts"));

        test.Should().Contain("SN-035");
        test.Should().Contain("documents no wire change");
        test.Should().Contain("does not invent draft-to-draft compare API");
        test.Should().Contain("clone-snapshot without a request body");
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
