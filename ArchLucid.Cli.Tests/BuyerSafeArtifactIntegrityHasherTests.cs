using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerSafeArtifactIntegrityHasherTests
{
    [Fact]
    public void BuildEntries_computes_sha256_and_byte_count_for_existing_files()
    {
        string dir = Path.Combine(Path.GetTempPath(), "integrity." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            Directory.CreateDirectory(dir);
            string path = Path.Combine(dir, "sample.txt");
            File.WriteAllText(path, "buyer-safe");

            IReadOnlyList<BuyerSafeArtifactIntegrityEntry> entries =
                BuyerSafeArtifactIntegrityHasher.BuildEntries(dir, ["sample.txt", "missing.txt"], "PASS");

            entries.Should().ContainSingle();
            entries[0].FileName.Should().Be("sample.txt");
            entries[0].ByteCount.Should().BeGreaterThan(0);
            entries[0].Sha256Hex.Should().HaveLength(64);
            entries[0].RedactionStatus.Should().Be("PASS");
        }
        finally
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, true);
        }
    }
}
