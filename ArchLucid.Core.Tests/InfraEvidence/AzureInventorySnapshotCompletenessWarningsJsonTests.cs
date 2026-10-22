using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventorySnapshotCompletenessWarningsJsonTests
{
    [Fact]
    public void Serialize_returns_null_for_empty_or_null_warnings()
    {
        AzureInventorySnapshotCompletenessWarningsJson.Serialize(null).Should().BeNull();
        AzureInventorySnapshotCompletenessWarningsJson.Serialize([]).Should().BeNull();
        AzureInventorySnapshotCompletenessWarningsJson.Serialize(["", "   "]).Should().BeNull();
    }

    [Fact]
    public void Serialize_orders_distinct_trimmed_warnings()
    {
        string? json = AzureInventorySnapshotCompletenessWarningsJson.Serialize(
        [
            "rbac-scope-too-broad:/subscriptions/sub",
            "  app-settings-not-collected-hosted-get-only  ",
            "rbac-scope-too-broad:/subscriptions/sub",
        ]);

        json.Should().NotBeNullOrWhiteSpace();
        AzureInventorySnapshotCompletenessWarningsJson.Deserialize(json)
            .Should()
            .Equal(
                "app-settings-not-collected-hosted-get-only",
                "rbac-scope-too-broad:/subscriptions/sub");
    }

    [Fact]
    public void Deserialize_returns_empty_for_blank_or_invalid_json()
    {
        AzureInventorySnapshotCompletenessWarningsJson.Deserialize(null).Should().BeEmpty();
        AzureInventorySnapshotCompletenessWarningsJson.Deserialize("").Should().BeEmpty();
        AzureInventorySnapshotCompletenessWarningsJson.Deserialize("{not-json}").Should().BeEmpty();
    }
}
