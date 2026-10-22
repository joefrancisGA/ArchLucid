using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.InfraEvidence;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryMetadataPropertyViewTests
{
    private static readonly Guid Row = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void View_is_read_only_case_insensitive_and_preserves_raw_rows_and_values()
    {
        AzureInventoryResourcePropertyReadModel usable = Property("Mixed.Case", " value ");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Properties = [usable, Property("MIXED.CASE", "secret", true), Property("Mixed.Case", " "),
                Property("Mixed.Case", null), Property("", "empty key is retained")],
        };
        AzureInventorySnapshotGraphIndexes index = AzureInventorySnapshotGraphIndexes.Create(snapshot, []);
        IReadOnlyDictionary<string, string> view = index.GetUsableProperties(Row);

        Assert.Equal(2, view.Count);
        Assert.Equal(" value ", view["mixed.case"]);
        Assert.Equal("empty key is retained", view[""]);
        Assert.Throws<NotSupportedException>(() => ((IDictionary<string, string>)view).Add("other", "value"));
        Assert.Equal(5, index.PropertiesByResourceRowId[Row].Count);
        Assert.Same(usable, index.PropertiesByResourceRowId[Row][0]);
        Assert.Equal("secret", snapshot.Properties[1].PropertyValue);
        Assert.True(snapshot.Properties[1].IsRedacted);
    }

    [Fact]
    public void View_is_cached_per_resource_row()
    {
        AzureInventorySnapshotGraphIndexes index = AzureInventorySnapshotGraphIndexes.Create(new()
        {
            Properties = [Property("key", "value")],
        }, []);
        Assert.Same(index.GetUsableProperties(Row), index.GetUsableProperties(Row));
    }

    [Fact]
    public void Missing_rows_are_distinct_from_filtered_empty_rows()
    {
        AzureInventorySnapshotGraphIndexes index = AzureInventorySnapshotGraphIndexes.Create(new()
        {
            Properties = [Property("key", "value", true), Property("other", " ")],
        }, []);
        Assert.True(index.PropertiesByResourceRowId.ContainsKey(Row));
        Assert.Empty(index.GetUsableProperties(Row));
        Assert.False(index.PropertiesByResourceRowId.ContainsKey(Guid.Empty));
        Assert.Throws<KeyNotFoundException>(() => index.GetUsableProperties(Guid.Empty));
    }

    [Fact]
    public void Duplicate_validation_is_lazy_and_failed_views_are_not_cached()
    {
        AzureInventorySnapshotGraphIndexes index = AzureInventorySnapshotGraphIndexes.Create(new()
        {
            Properties = [Property("key", "first"), Property("KEY", "second")],
        }, []);
        Assert.Equal(2, index.PropertiesByResourceRowId[Row].Count);
        Assert.Throws<ArgumentException>(() => index.GetUsableProperties(Row));
        Assert.Throws<ArgumentException>(() => index.GetUsableProperties(Row));
        Assert.Equal("first", index.PropertiesByResourceRowId[Row][0].PropertyValue);
        Assert.Equal("second", index.PropertiesByResourceRowId[Row][1].PropertyValue);
    }

    [Fact]
    public void Views_are_scoped_to_their_snapshot_index()
    {
        AzureInventorySnapshotGraphIndexes first = AzureInventorySnapshotGraphIndexes.Create(new()
        {
            Properties = [Property("key", "first")],
        }, []);
        AzureInventorySnapshotGraphIndexes second = AzureInventorySnapshotGraphIndexes.Create(new()
        {
            Properties = [Property("key", "second")],
        }, []);
        Assert.Equal("first", first.GetUsableProperties(Row)["key"]);
        Assert.Equal("second", second.GetUsableProperties(Row)["key"]);
        Assert.NotSame(first.GetUsableProperties(Row), second.GetUsableProperties(Row));
    }

    [Theory]
    [MemberData(nameof(AzureInventoryMetadataPropertyConversionTests.Cases), MemberType = typeof(AzureInventoryMetadataPropertyConversionTests))]
    public void Shared_index_matches_independent_hydration_including_failures(bool parent, string scenario)
    {
        var (snapshot, independentOwner, independentNodes) = AzureInventoryMetadataPropertyConversionTests.Fixture(parent, scenario);
        var (_, sharedOwner, sharedNodes) = AzureInventoryMetadataPropertyConversionTests.Fixture(parent, scenario);
        AzureInventorySnapshotGraphIndexes index = AzureInventorySnapshotGraphIndexes.Create(snapshot, sharedNodes);
        Exception? independent = Record.Exception(() =>
        {
            if (parent) AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, independentNodes);
            else AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, independentNodes);
        });
        Exception? shared = Record.Exception(() =>
        {
            if (parent) AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, sharedNodes, index);
            else AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, sharedNodes, index);
        });
        Assert.Equal(independent?.GetType(), shared?.GetType());
        Assert.Equal(independent?.Message, shared?.Message);
        Assert.Equal(JsonSerializer.Serialize(independentOwner), JsonSerializer.Serialize(sharedOwner));
        Assert.Equal(JsonSerializer.Serialize(independentNodes), JsonSerializer.Serialize(sharedNodes));
    }

    private static AzureInventoryResourcePropertyReadModel Property(string key, string? value, bool redacted = false) => new()
    {
        ResourceRowId = Row, PropertyKey = key, PropertyValue = value, IsRedacted = redacted,
    };
}
