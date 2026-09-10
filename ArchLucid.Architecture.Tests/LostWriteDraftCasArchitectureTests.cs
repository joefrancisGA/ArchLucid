using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Lost-write LW-015 / LW-022 / LW-026: forceOverwrite audit, separate start-review guard, shared in-memory CAS.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LostWriteDraftCasArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Lw015_force_overwrite_audit_is_required_and_fail_closed()
    {
        string support = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftForceOverwriteAuditSupport.cs"));
        string required = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Audit", "RequiredAuditEventTypes.cs"));
        string mutate = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "Stages", "DraftRequestMutateStage.cs"));

        support.Should().Contain("LogOrThrowAsync");
        support.Should().Contain(nameof(AuditEventTypes.DraftIntakeForceOverwriteApplied));
        required.Should().Contain(nameof(AuditEventTypes.DraftIntakeForceOverwriteApplied));
        mutate.Should().Contain("LogForceOverwriteAsync");
        mutate.Should().Contain("patch.ForceOverwrite == true");
    }

    [Fact]
    public void Lw022_patch_cas_and_start_review_guards_remain_distinct()
    {
        string patchGuardPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Drafts",
            "DraftPatchStaleUpdatedUtcGuard.cs");
        string startReviewGuardPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Drafts",
            "DraftStartReviewStaleUpdatedUtcGuard.cs");
        string mutate = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "Stages", "DraftRequestMutateStage.cs"));
        string submit = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftAdmissionService.SubmitAndHeal.cs"));

        File.Exists(patchGuardPath).Should().BeTrue();
        File.Exists(startReviewGuardPath).Should().BeTrue();
        mutate.Should().Contain("DraftPatchStaleUpdatedUtcGuard");
        mutate.Should().NotContain("DraftStartReviewStaleUpdatedUtcGuard");
        submit.Should().Contain("DraftStartReviewStaleUpdatedUtcGuard");
        submit.Should().NotContain("DraftPatchStaleUpdatedUtcGuard");
    }

    [Fact]
    public void Lw026_in_memory_draft_repository_does_not_bypass_cas_guard()
    {
        string repository = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Data",
                "Repositories",
                "InMemoryDraftRequestRepository.cs"));
        string mutate = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "Stages", "DraftRequestMutateStage.cs"));

        repository.Should().NotContain("ExpectedUpdatedUtc");
        repository.Should().NotContain("ForceOverwrite");
        mutate.Should().Contain("DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
