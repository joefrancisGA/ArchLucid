using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-039 ratchet: live presence is out of wave — LW-089 lease only, no UI occupancy.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn039DoNotImplementLivePresenceArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn039_records_live_presence_as_not_shipped_residual()
    {
        string residuals = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-out-of-wave-residuals.ts"));
        string doc = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md"));

        residuals.Should().Contain("SN-039");
        residuals.Should().Contain("not-shipped");
        residuals.Should().Contain("Live presence");
        residuals.Should().Contain("LW-089");

        doc.Should().Contain("SN-039");
        doc.Should().Contain("Not shipped");
        doc.Should().Contain("Collab strip");
        doc.Should().Contain("Do not claim");
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

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
