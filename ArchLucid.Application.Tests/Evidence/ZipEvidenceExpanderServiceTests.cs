using System.IO.Compression;
using System.Text;

using ArchLucid.Core.Evidence;

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
}
