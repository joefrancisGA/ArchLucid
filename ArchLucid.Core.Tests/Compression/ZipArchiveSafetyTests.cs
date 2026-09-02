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

    [Fact]
    public void ValidateArchive_rejects_archives_exceeding_total_uncompressed_bytes()
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry("big.txt");
            using StreamWriter writer = new(entry.Open());
            writer.Write(new string('x', 1024));
        }

        stream.Position = 0;

        using ZipArchive readArchive = new(stream, ZipArchiveMode.Read, leaveOpen: true);

        ZipArchiveSafetyResult result = ZipArchiveSafety.ValidateArchive(readArchive, maxTotalUncompressedBytes: 100);

        result.Allowed.Should().BeFalse();
        result.ErrorDetail.Should().Contain("cumulative uncompressed size");
    }

    [Fact]
    public void ValidateArchive_rejects_archives_exceeding_compression_ratio()
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry("ratio.txt");
            using StreamWriter writer = new(entry.Open());
            writer.Write(new string('a', 20_000));
        }

        stream.Position = 0;

        using ZipArchive readArchive = new(stream, ZipArchiveMode.Read, leaveOpen: true);

        ZipArchiveSafetyResult result = ZipArchiveSafety.ValidateArchive(readArchive, maxCompressionRatio: 2);

        result.Allowed.Should().BeFalse();
        result.ErrorDetail.Should().Contain("compression ratio");
    }
}
