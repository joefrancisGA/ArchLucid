using System.Diagnostics;
using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Evidence;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ZipEvidenceExpanderServiceTests
{
    [Fact]
    public void Expand_flattens_nested_directories_into_unique_file_names()
    {
        string tempRoot = Path.Combine(Path.GetTempPath(), "archlucid-zip-test-" + Guid.NewGuid().ToString("N"));
        string nestedDir = Path.Combine(tempRoot, "audit", "controls");
        Directory.CreateDirectory(nestedDir);
        File.WriteAllBytes(Path.Combine(nestedDir, "evidence.pdf"), Encoding.UTF8.GetBytes("pdf-bytes"));
        File.WriteAllText(Path.Combine(tempRoot, "readme.txt"), "hello");

        string zipPath = Path.Combine(Path.GetTempPath(), "archlucid-zip-" + Guid.NewGuid().ToString("N") + ".zip");

        try
        {
            ZipFile.CreateFromDirectory(tempRoot, zipPath);

            using FileStream zipStream = File.OpenRead(zipPath);
            ZipEvidenceExpanderService sut = new(
                Options.Create(new ZipEvidenceExpanderOptions()),
                NullLogger<ZipEvidenceExpanderService>.Instance);

            ZipEvidenceExpansionResult result = sut.Expand(zipStream, "evidence.zip");

            result.Files.Should().HaveCount(2);
            result.Files.Select(f => f.FileName).Should().Contain("audit_controls_evidence.pdf");
            result.Files.Select(f => f.FileName).Should().Contain("readme.txt");
        }
        finally
        {
            if (Directory.Exists(tempRoot))
                Directory.Delete(tempRoot, recursive: true);

            if (File.Exists(zipPath))
                File.Delete(zipPath);
        }
    }

    [Fact]
    public void Expand_sets_evidence_package_id_activity_tag_when_provided()
    {
        List<Activity> stopped = [];
        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == ArchLucidMeterNames.EvidenceZipExpansionActivitySource;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;
        ActivitySource.AddActivityListener(listener);

        Guid packageId = Guid.NewGuid();
        byte[] zipBytes = CreateSingleFileZip("sample.txt", "content");

        using MemoryStream zipStream = new(zipBytes);
        ZipEvidenceExpanderService sut = new(
            Options.Create(new ZipEvidenceExpanderOptions()),
            NullLogger<ZipEvidenceExpanderService>.Instance);

        sut.Expand(zipStream, "evidence.zip", packageId);

        stopped.Should().ContainSingle();
        stopped[0].GetTagItem(ActivityScopeTags.EvidencePackageIdTag).Should().Be(packageId.ToString("D"));
    }

    private static byte[] CreateSingleFileZip(string entryName, string content)
    {
        using MemoryStream zipStream = new();
        using (ZipArchive archive = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry(entryName);
            using Stream writer = entry.Open();
            using StreamWriter textWriter = new(writer);
            textWriter.Write(content);
        }

        return zipStream.ToArray();
    }
}
