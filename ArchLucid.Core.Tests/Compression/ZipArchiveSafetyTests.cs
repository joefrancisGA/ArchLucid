using System.IO.Compression;
using System.Text;

using ArchLucid.Core.Compression;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Compression;

[Trait("Suite", "Core")]
public sealed class ZipArchiveSafetyTests
{
    [Fact]
    public void IsSafeEntryPath_rejects_zip_slip_paths()
    {
        ZipArchiveSafety.IsSafeEntryPath("../secrets.txt").Should().BeFalse();
        ZipArchiveSafety.IsSafeEntryPath("/etc/passwd").Should().BeFalse();
        ZipArchiveSafety.IsSafeEntryPath("diagrams/topology.png").Should().BeTrue();
    }

    [Fact]
    public void ValidateArchive_rejects_archives_exceeding_entry_limit()
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            for (int index = 0; index < 5; index++)
            {
                ZipArchiveEntry entry = archive.CreateEntry($"file-{index}.txt");
                using StreamWriter writer = new(entry.Open());
                writer.Write("x");
            }
        }

        stream.Position = 0;

        using ZipArchive readArchive = new(stream, ZipArchiveMode.Read, leaveOpen: true);

        ZipArchiveSafetyResult result = ZipArchiveSafety.ValidateArchive(readArchive, maxFileEntries: 3);

        result.Allowed.Should().BeFalse();
        result.ErrorDetail.Should().Contain("maximum file entry count");
    }
}
