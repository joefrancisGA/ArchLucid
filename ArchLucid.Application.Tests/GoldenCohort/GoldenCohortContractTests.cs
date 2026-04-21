using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Tests.GoldenCohort;

/// <summary>
/// Validates the committed golden cohort JSON (N=20) used for nightly simulator drift automation.
/// </summary>
public sealed class GoldenCohortContractTests
{
    [Fact]
    public void Cohort_json_exists_has_twenty_items_and_valid_sha_placeholders()
    {
        string path = Path.Combine(AppContext.BaseDirectory, "golden-cohort", "cohort.json");
        Assert.True(File.Exists(path), $"Missing {path} — ensure cohort.json is copied to output.");

        string json = File.ReadAllText(path);
        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        Assert.Equal(1, root.GetProperty("schemaVersion").GetInt32());

        JsonElement items = root.GetProperty("items");
        Assert.Equal(20, items.GetArrayLength());

        Regex sha = new("^[0-9a-f]{64}$", RegexOptions.CultureInvariant | RegexOptions.Compiled);

        foreach (JsonElement item in items.EnumerateArray())
        {
            string id = item.GetProperty("id").GetString() ?? "";
            Assert.False(string.IsNullOrWhiteSpace(id), "Each item needs an id.");

            string hash = item.GetProperty("expectedCommittedManifestSha256").GetString() ?? "";
            Assert.True(sha.IsMatch(hash), $"Item {id}: expectedCommittedManifestSha256 must be 64 hex chars.");

            JsonElement cats = item.GetProperty("expectedFindingCategories");
            Assert.True(cats.GetArrayLength() > 0, $"Item {id}: expectedFindingCategories must not be empty.");
        }
    }
}
