using System.IO;

using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LiveSeatPostAuthBootstrapRatchetTests
{
    [Fact]
    public void LiveSeatLs019_adr_0102_file_exists()
    {
        string repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string adrPath = Path.Combine(
            repoRoot,
            "docs",
            "architecture",
            "adrs",
            "0102-first-login-live-workspace-explicit-training.md");

        File.Exists(adrPath).Should().BeTrue();
        File.ReadAllText(adrPath).Should().Contain("Training is not Practice");
    }

    [Fact]
    public void LiveSeatLs022_post_auth_create_workspace_request_defaults_include_demo_seed_false()
    {
        PostAuthCreateWorkspaceRequest request = new()
        {
            WorkspaceName = "Ops",
            TermsAccepted = true
        };

        request.IncludeDemoSeed.Should().BeFalse();
    }
}
