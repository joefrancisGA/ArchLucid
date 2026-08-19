using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Support;

[Trait("Category", "Unit")]
public sealed class SupportBundleArchiveWriterEdgeCaseTests
{
    [Fact]
    public void WriteZip_throws_when_bundle_directory_missing()
    {
        string zipPath = Path.Combine(Path.GetTempPath(), $"archlucid-missing-bundle-{Guid.NewGuid():N}.zip");

        Action act = () => SupportBundleArchiveWriter.WriteZip(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N")), zipPath);

        act.Should().Throw<DirectoryNotFoundException>();
    }
}
