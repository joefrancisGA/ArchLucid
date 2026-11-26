using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CanonicalFindingCorrelationKeyTests
{
    private const string AssetKey = "asset:Azure/Storage-1";
    private const string GoldenKey = "fnd:v2:377b73bfb738956942d8a86ff12622220176a39cb65b8b25c39a546906ca06d9";

    private static readonly ProjectScopeKey Scope = ProjectScopeKey.Create(
        Guid.Parse("10000000-0000-0000-0000-000000000001"),
        Guid.Parse("10000000-0000-0000-0000-000000000002"),
        Guid.Parse("10000000-0000-0000-0000-000000000003"));

    [Fact]
    public void CanonicalKey_PinsEncodingAndAgreesAcrossFindingModels()
    {
        ArchitectureFinding review = new()
        {
            FindingId = "review-original-id",
            PolicyRuleId = "  RuLE-A  ",
            Category = " SECURITY ",
            Message = " ÖFFENTLICH\u00a0  Storage\t",
        };
        Finding snapshot = new()
        {
            FindingId = "snapshot-original-id",
            PolicyRuleId = "rule-a",
            Category = "security",
            Title = "öffentlich storage",
        };
        string? reviewV1 = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(review);
        string snapshotV1 = FindingSnapshotMergeKey.FromFinding(snapshot);

        Assert.NotEqual(reviewV1, snapshotV1);
        Assert.Equal(GoldenKey, NormalizedFindingFingerprintNormalizer.TryBuildCanonicalKey(review, Scope, AssetKey));
        Assert.Equal(GoldenKey, FindingSnapshotMergeKey.TryBuildCanonicalKey(snapshot, Scope, AssetKey));
        Assert.Equal(reviewV1, NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(review));
        Assert.Equal(snapshotV1, FindingSnapshotMergeKey.FromFinding(snapshot));
        Assert.Equal("review-original-id", review.FindingId);
        Assert.Equal("snapshot-original-id", snapshot.FindingId);
    }

    [Fact]
    public void CanonicalKey_SeparatesEveryScopeCoordinateAndTreatsAssetAsOrdinal()
    {
        Guid other = Guid.Parse("10000000-0000-0000-0000-000000000004");

        string?[] keys =
        [
            Key(Scope, AssetKey),
            Key(ProjectScopeKey.Create(other, Scope.WorkspaceId, Scope.ProjectId), AssetKey),
            Key(ProjectScopeKey.Create(Scope.TenantId, other, Scope.ProjectId), AssetKey),
            Key(ProjectScopeKey.Create(Scope.TenantId, Scope.WorkspaceId, other), AssetKey),
            Key(Scope, "asset:Azure/Storage-2"),
            Key(Scope, "asset:Azure/storage-1"),
        ];

        Assert.All(keys, key => Assert.NotNull(key));
        Assert.Equal(keys.Length, keys.Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void CanonicalKey_DoesNotInheritTheLegacyDelimiterCollision()
    {
        Finding left = new() { PolicyRuleId = "rule-a", Category = "a|b", Title = "c" };
        Finding right = new() { PolicyRuleId = "rule-a", Category = "a", Title = "b|c" };
        string legacy = FindingSnapshotMergeKey.FromFinding(left);

        Assert.Equal(legacy, FindingSnapshotMergeKey.FromFinding(right));

        string? leftKey = FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(left, Scope, AssetKey, legacy);
        string? rightKey = FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(right, Scope, AssetKey, legacy);

        Assert.NotNull(leftKey);
        Assert.NotNull(rightKey);
        Assert.NotEqual(leftKey, rightKey);
    }

    [Fact]
    public void CanonicalKey_SeparatesDifferentPolicyRulesForTheSameScopedText()
    {
        Assert.NotEqual(
            Key(Scope, AssetKey),
            FindingCorrelationKeyV2.TryBuild(Scope, AssetKey, "rule-b", "security", "public storage"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t ")]
    [InlineData(" asset:Azure/Storage-1")]
    [InlineData("asset:Azure/Storage-1 ")]
    public void CanonicalKey_RejectsMissingOrUncanonicalAsset(string? assetKey)
    {
        Assert.Null(Key(Scope, assetKey));
    }

    [Fact]
    public void CanonicalKey_DoesNotGuessMissingInputsOrReplaceMalformedUtf16()
    {
        Assert.Null(Key(null, AssetKey));
        Assert.Null(FindingCorrelationKeyV2.TryBuild(Scope, AssetKey, " ", "security", "public storage"));
        Assert.Null(FindingCorrelationKeyV2.TryBuild(Scope, AssetKey, "rule-a", null, "public storage"));
        Assert.Null(FindingCorrelationKeyV2.TryBuild(Scope, AssetKey, "rule-a", "security", "\t"));
        Assert.Null(Key(Scope, "asset:\uD800"));
        Assert.Null(FindingCorrelationKeyV2.TryBuild(Scope, AssetKey, "rule-a", "security", "\uD800"));
        Assert.NotNull(Key(Scope, "asset:\uFFFD"));
    }

    [Fact]
    public void MixedVersions_RebuildFromEachOwnLegacyProfileAndTrustedSource()
    {
        ArchitectureFinding review = new() { PolicyRuleId = "RULE-A", Category = "security", Message = "public storage" };
        Finding snapshot = new() { PolicyRuleId = "rule-a", Category = "security", Title = "public storage" };
        string? reviewV1 = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(review);
        string snapshotV1 = FindingSnapshotMergeKey.FromFinding(snapshot);
        string? expected = Key(Scope, AssetKey);

        Assert.NotNull(expected);
        Assert.Equal(expected, NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(
            review, Scope, AssetKey, reviewV1));
        Assert.Equal(expected, FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, Scope, AssetKey, snapshotV1));
        Assert.Null(NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(
            review, Scope, AssetKey, snapshotV1));
        Assert.Null(NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(
            review, Scope, null, reviewV1));
        Assert.Null(FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, Scope, AssetKey, reviewV1));
        Assert.Null(FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, null, AssetKey, snapshotV1));
        Assert.Null(FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, Scope, AssetKey, expected));

        snapshot.Title = "changed title";
        Assert.Null(FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, Scope, AssetKey, snapshotV1));
    }

    [Fact]
    public void LegacyFuzzyKeys_CannotBeRebuiltAsCanonicalPolicyKeys()
    {
        Finding snapshot = new() { Category = "security", Title = "public storage" };
        string fuzzy = FindingSnapshotMergeKey.FromFinding(snapshot);
        ArchitectureFinding review = new() { Category = "security", Message = "public storage" };

        Assert.Equal("security|public storage", fuzzy);
        Assert.Null(FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(snapshot, Scope, AssetKey, fuzzy));
        Assert.Null(NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(review, Scope, AssetKey, fuzzy));
        Assert.Null(NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(review, Scope, AssetKey, null));
    }

    [Fact]
    public void CloudAssetBinding_UsesTheDurableDirectoryIdOnlyInItsExactProject()
    {
        Guid resourceId = Guid.Parse("10000000-0000-0000-0000-000000000005");
        Guid otherScope = Guid.Parse("10000000-0000-0000-0000-000000000006");
        CloudResourceIdentityRecord row = new()
        {
            CloudResourceId = resourceId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            ExternalResourceIdNormalized = "provider-external-id",
            DisplayName = "mutable label",
        };

        string? assetKey = FindingCorrelationAssetKey.TryFromCloudResource(Scope, row);
        Assert.Equal("cloud-resource:10000000000000000000000000000005", assetKey);
        Assert.NotNull(Key(Scope, assetKey));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(null, row));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(Scope, null));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(
            ProjectScopeKey.Create(otherScope, Scope.WorkspaceId, Scope.ProjectId), row));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(
            ProjectScopeKey.Create(Scope.TenantId, otherScope, Scope.ProjectId), row));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(
            ProjectScopeKey.Create(Scope.TenantId, Scope.WorkspaceId, otherScope), row));
        Assert.Null(FindingCorrelationAssetKey.TryFromCloudResource(Scope, new CloudResourceIdentityRecord
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            ExternalResourceIdNormalized = "provider-external-id",
        }));
    }

    private static string? Key(ProjectScopeKey? scope, string? assetKey) =>
        FindingCorrelationKeyV2.TryBuild(scope, assetKey, "rule-a", "security", "public storage");
}
