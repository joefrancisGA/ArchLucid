using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-005 ratchet: spawn-locked draft bookmark/history back targets review job or desk — not writable draft editor.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn005BookmarkYesterdayDraftArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn005_working_back_href_declares_spawn_locked_draft_back_helpers()
    {
        string workingBackHref = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "working-back-href.ts"));

        workingBackHref.Should().Contain("resolveSpawnLockedDraftBackLocator");
        workingBackHref.Should().Contain("ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL");
        workingBackHref.Should().Contain("isArchitectureDraftWritableEditorRoutePath");
    }

    [Fact]
    public void Sn005_handoff_and_workspace_wire_spawn_lock_back_honesty()
    {
        string handoffPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureDraftHandoffPanel.tsx"));
        string vitest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-spawn-lock-draft-back.test.ts"));

        handoffPanel.Should().Contain("architecture-draft-spawn-lock-back-honesty");
        handoffPanel.Should().Contain("resolveSpawnLockedDraftBackLocator");
        vitest.Should().Contain("SN-005");
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
