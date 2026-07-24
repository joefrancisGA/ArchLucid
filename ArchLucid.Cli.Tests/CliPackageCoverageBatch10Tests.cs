using System.Security.Cryptography;
using System.Text;

using ArchLucid.Cli.Real;
using ArchLucid.Cli.Support;
using ArchLucid.Cli.Validation;

using FluentAssertions;

using Microsoft.Data.Sqlite;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch10Tests
{
    [Fact]
    public void ComposePathListBuilder_orders_base_compose_and_overlays()
    {
        IReadOnlyList<string> paths = ComposePathListBuilder.BuildAbsolutePaths(
            @"C:\stack",
            ["docker-compose.override.yml", "docker-compose.prod.yml"]);

        paths.Should().HaveCount(3);
        paths[0].Should().EndWith("docker-compose.yml");
        paths[1].Should().EndWith("docker-compose.override.yml");
        paths[2].Should().EndWith("docker-compose.prod.yml");
    }

    [Fact]
    public void ComposePathListBuilder_rejects_blank_compose_directory()
    {
        Action act = () => ComposePathListBuilder.BuildAbsolutePaths("  ", []);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void QuickStartSQLiteProjectRegistry_upserts_project_row()
    {
        string dbPath = Path.Combine(Path.GetTempPath(), "archlucid-cli-registry-" + Guid.NewGuid().ToString("N") + ".sqlite");

        try
        {
            QuickStartSQLiteProjectRegistry.EnsureRegistered(
                dbPath,
                "PilotWorkspace",
                @"C:\work",
                overwriteExistingFiles: true,
                includeTerraformStubs: false);

            using (SqliteConnection connection = new($"Data Source={dbPath}"))
            {
                connection.Open();

                using SqliteCommand read = connection.CreateCommand();
                read.CommandText = "SELECT BaseDirectory, OverwriteExistingFiles, IncludeTerraformStubs FROM PROJECTS WHERE ProjectName = @name";
                read.Parameters.AddWithValue("@name", "PilotWorkspace");

                using SqliteDataReader reader = read.ExecuteReader();
                reader.Read().Should().BeTrue();
                reader.GetString(0).Should().Be(@"C:\work");
                reader.GetInt32(1).Should().Be(1);
                reader.GetInt32(2).Should().Be(0);
            }
        }
        finally
        {
            if (File.Exists(dbPath))
            {
                try
                {
                    File.Delete(dbPath);
                }
                catch (IOException)
                {
                    // Windows may retain the handle briefly after connection dispose.
                }
            }
        }
    }

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
