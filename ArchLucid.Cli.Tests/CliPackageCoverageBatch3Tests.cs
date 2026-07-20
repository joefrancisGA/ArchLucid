using ArchLucid.Cli.Support;
using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch3Tests
{
    [Fact]
    public void WriteZip_creates_archive_from_written_bundle_directory()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        string dir = Path.Combine(Path.GetTempPath(), "bundleZip." + Guid.NewGuid().ToString("N")[..8]);
        string zipPath = Path.Combine(Path.GetTempPath(), "bundleZip." + Guid.NewGuid().ToString("N")[..8] + ".zip");

        try
        {
            SupportBundleArchiveWriter.WriteDirectory(payload, dir);
            SupportBundleArchiveWriter.WriteZip(dir, zipPath);

            File.Exists(zipPath).Should().BeTrue();
            new FileInfo(zipPath).Length.Should().BeGreaterThan(0);
        }
        finally
        {
            if (Directory.Exists(dir))
            {
                Directory.Delete(dir, true);
            }

            if (File.Exists(zipPath))
            {
                File.Delete(zipPath);
            }
        }
    }
}
