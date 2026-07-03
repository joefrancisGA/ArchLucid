using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-590 — hybrid hot-path cache must not reintroduce manual JSON round-trips on hits.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HybridHotPathReadCacheArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb590_hybrid_hot_path_read_cache_uses_typed_slots_not_manual_json_round_trip()
    {
        string cachePath = Path.Combine(RepoRoot, "ArchLucid.Persistence", "Caching", "HybridHotPathReadCache.cs");
        string slotPath = Path.Combine(RepoRoot, "ArchLucid.Persistence", "Caching", "HotPathTypedCacheSlot.cs");
        string legacyEnvelopePath = Path.Combine(RepoRoot, "ArchLucid.Persistence", "Caching", "HotPathWireEnvelope.cs");

        File.Exists(cachePath).Should().BeTrue();
        File.Exists(slotPath).Should().BeTrue();
        File.Exists(legacyEnvelopePath).Should().BeFalse("HotPathWireEnvelope was removed by TB-590.");

        string cacheText = File.ReadAllText(cachePath);

        cacheText.Should().Contain("HotPathTypedCacheSlot");
        cacheText.Should().Contain("TB-590");
        cacheText.Should().NotContain("HotPathWireEnvelope");
        cacheText.Should().NotContain("JsonSerializer.SerializeToUtf8Bytes");
        cacheText.Should().NotContain("JsonSerializer.Deserialize<T>");
    }

    [Fact]
    public void Tb590_hybrid_hot_path_read_cache_tests_cover_typed_slot_semantics()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Persistence.Tests", "HybridHotPathReadCacheTests.cs");

        File.Exists(path).Should().BeTrue();
        File.ReadAllText(path).Should().Contain("HotPathTypedCacheSlot_preserves_negative_cache_semantics");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
