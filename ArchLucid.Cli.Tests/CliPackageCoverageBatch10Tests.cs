using System.Security.Cryptography;
using System.Text;

using ArchLucid.Cli.Support;
using ArchLucid.Cli.Validation;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch10Tests
{
    [Fact]
    public void BuyerSafeArtifactIntegrityHasher_hashes_existing_files_only()
    {
        string dir = Path.Combine(Path.GetTempPath(), "archlucid-cli-hash-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);

        try
        {
            string fileName = "proof.json";
            byte[] bytes = Encoding.UTF8.GetBytes("""{"ok":true}""");
            File.WriteAllBytes(Path.Combine(dir, fileName), bytes);
            string expected = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

            IReadOnlyList<BuyerSafeArtifactIntegrityEntry> entries =
                BuyerSafeArtifactIntegrityHasher.BuildEntries(dir, [fileName, "missing.txt"], "pass");

            entries.Should().ContainSingle();
            entries[0].FileName.Should().Be(fileName);
            entries[0].Sha256Hex.Should().Be(expected);
            entries[0].RedactionStatus.Should().Be("pass");
        }
        finally
        {
            Directory.Delete(dir, recursive: true);
        }
    }

    [Fact]
    public void PolicyPackKnownRuleKeyResolver_loads_rule_ids_from_repo_packs()
    {
        HashSet<string> keys = PolicyPackKnownRuleKeyResolver.TryLoadKnownRuleKeys();

        keys.Should().NotBeEmpty();
        keys.Should().Contain(key => key.Length > 0);
    }
}
