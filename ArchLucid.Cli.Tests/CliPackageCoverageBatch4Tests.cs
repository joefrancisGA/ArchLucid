using ArchLucid.Cli.Support;
using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch4Tests
{
    [Fact]
    public void WriteDirectory_materializes_manifest_and_section_files()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-07-20T00:00:00Z", CliWorkingDirectory = "/tmp/cli" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        string dir = Path.Combine(Path.GetTempPath(), "cli-cov4-" + Guid.NewGuid().ToString("N")[..10]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectory(payload, dir);

            Directory.Exists(dir).Should().BeTrue();
            Directory.EnumerateFiles(dir, "*", SearchOption.AllDirectories).Should().NotBeEmpty();
        }
        finally
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, recursive: true);
        }
    }

    [Fact]
    public void WriteDirectory_then_WriteZip_produces_archive_bytes()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-07-20T12:00:00Z", CliWorkingDirectory = "C:\\work" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        string dir = Path.Combine(Path.GetTempPath(), "cli-cov4z-" + Guid.NewGuid().ToString("N")[..10]);
        string zipPath = Path.Combine(Path.GetTempPath(), "cli-cov4z-" + Guid.NewGuid().ToString("N")[..10] + ".zip");

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
                Directory.Delete(dir, recursive: true);

            if (File.Exists(zipPath))
                File.Delete(zipPath);
        }
    }
}
