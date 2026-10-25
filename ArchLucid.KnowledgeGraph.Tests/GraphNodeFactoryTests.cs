using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Tests for Graph Node Factory.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GraphNodeFactoryTests
{
    private readonly GraphNodeFactory _sut = new();

    [Fact]
    public void CreateNode_NullItem_ThrowsArgumentNullException()
    {
        Action act = () => _sut.CreateNode(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void CreateNode_SetsNodeIdFromObjectId()
    {
        CanonicalObject item = BuildItem();

        GraphNode node = _sut.CreateNode(item);

        node.NodeId.Should().Be($"obj-{item.ObjectId}");
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_object_id_when_building_node_id()
    {
        CanonicalObject item = BuildItem(objectId: "  sql-inv-1  ");

        GraphNode node = _sut.CreateNode(item);

        node.NodeId.Should().Be("obj-sql-inv-1");
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_source_id()
    {
        CanonicalObject item = BuildItem(sourceId: "  src-42  ");

        GraphNode node = _sut.CreateNode(item);

        node.SourceId.Should().Be("src-42");
    }

    [Fact]
    public void CreateNode_SetsNodeTypeFromObjectType()
    {
        CanonicalObject item = BuildItem();

        GraphNode node = _sut.CreateNode(item);

        node.NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_object_type_when_building_node_type()
    {
        CanonicalObject item = BuildItem(objectType: $"  {GraphNodeTypes.TopologyResource}  ");

        GraphNode node = _sut.CreateNode(item);

        node.NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void CreateNode_SetsLabelFromName()
    {
        CanonicalObject item = BuildItem(name: "My Resource");

        GraphNode node = _sut.CreateNode(item);

        node.Label.Should().Be("My Resource");
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_name_when_building_label()
    {
        CanonicalObject item = BuildItem(name: "  API Gateway  ");

        GraphNode node = _sut.CreateNode(item);

        node.Label.Should().Be("API Gateway");
    }

    [Fact]
    public void CreateNode_SetsCategoryFromProperties()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>
        {
            ["category"] = GraphTopologyCategories.Storage
        });

        GraphNode node = _sut.CreateNode(item);

        node.Category.Should().Be(GraphTopologyCategories.Storage);
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_category_property_when_building_category()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>
        {
            ["category"] = $"  {GraphTopologyCategories.Storage}  ",
        });

        GraphNode node = _sut.CreateNode(item);

        node.Category.Should().Be(GraphTopologyCategories.Storage);
    }

    [Fact]
    public void CreateNode_NoCategoryProperty_CategoryIsNull()
    {
        CanonicalObject item = BuildItem();

        GraphNode node = _sut.CreateNode(item);

        node.Category.Should().BeNull();
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_property_bag_keys()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>
        {
            ["  principalId  "] = "principal-1",
            ["  category  "] = $"  {GraphTopologyCategories.Storage}  ",
        });

        GraphNode node = _sut.CreateNode(item);

        node.Properties.Should().ContainKey("principalId").WhoseValue.Should().Be("principal-1");
        node.Category.Should().Be(GraphTopologyCategories.Storage);

        DeclarationExistingNodeResolver.TryReadProperty(node.Properties, "principalId", out string principalId)
            .Should().BeTrue();
        principalId.Should().Be("principal-1");
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_property_bag_string_values()
    {
        const string armSqlId =
            "/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/pay/providers/Microsoft.Sql/servers/pay-sql";

        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>
        {
            ["azureResourceId"] = $"  {armSqlId}  ",
            ["principalId"] = "  principal-1  ",
        });

        GraphNode node = _sut.CreateNode(item);

        node.Properties["azureResourceId"].Should().Be(armSqlId);
        node.Properties["principalId"].Should().Be("principal-1");

        DeclarationExistingNodeResolver.NodeMatchesDeclaredId(node, armSqlId).Should().BeTrue();
    }

    [Fact]
    public void CreateNode_CopiesAllProperties()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>
        {
            ["text"] = "hello",
            ["ref"] = "POL-001"
        });

        GraphNode node = _sut.CreateNode(item);

        node.Properties.Should().ContainKey("text").WhoseValue.Should().Be("hello");
        node.Properties.Should().ContainKey("ref").WhoseValue.Should().Be("POL-001");
    }

    [Fact]
    public void CreateNode_NullProperties_ProducesEmptyGraphProperties()
    {
        CanonicalObject item = BuildItem();
        item.Properties = null!;

        GraphNode node = _sut.CreateNode(item);

        node.Properties.Should().BeEmpty();
    }

    [Fact]
    public void CreateNode_DuplicatePropertyKeysDifferingOnlyByCase_ThrowsArgumentException()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["category"] = "compute",
            ["Category"] = "storage"
        });

        Action act = () => _sut.CreateNode(item);

        act.Should().Throw<ArgumentException>().WithParameterName("item");
    }

    [Fact]
    public void CreateNode_deduplicates_property_keys_differing_only_by_surrounding_whitespace_on_key()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.kind"] = "Deployment",
            ["  k8s.kind  "] = "Deployment",
        });

        GraphNode node = _sut.CreateNode(item);

        node.Properties.Should().HaveCount(1);
        node.Properties.Should().ContainKey("k8s.kind").WhoseValue.Should().Be("Deployment");

        GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.kind", out string? kind)
            .Should().BeTrue();
        kind.Should().Be("Deployment");
    }

    [Fact]
    public void CreateNode_throws_when_padded_duplicate_property_keys_have_conflicting_values()
    {
        CanonicalObject item = BuildItem(properties: new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.kind"] = "Deployment",
            ["  k8s.kind  "] = "Service",
        });

        Action act = () => _sut.CreateNode(item);

        act.Should().Throw<ArgumentException>().WithParameterName("item");
    }

    [Fact]
    public void CreateNode_WhitespaceObjectType_ThrowsArgumentException()
    {
        CanonicalObject item = BuildItem();
        item.ObjectType = "   ";

        Action act = () => _sut.CreateNode(item);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateNode_WhitespaceName_ThrowsArgumentException()
    {
        CanonicalObject item = BuildItem();
        item.Name = "\t";

        Action act = () => _sut.CreateNode(item);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateNode_SetsSourceTypeAndSourceId()
    {
        CanonicalObject item = BuildItem(sourceType: "InlineConnector", sourceId: "src-42");

        GraphNode node = _sut.CreateNode(item);

        node.SourceType.Should().Be("InlineConnector");
        node.SourceId.Should().Be("src-42");
    }

    [Fact]
    public void CreateNode_trims_surrounding_whitespace_on_source_type()
    {
        CanonicalObject item = BuildItem(sourceType: "  InlineConnector  ");

        GraphNode node = _sut.CreateNode(item);

        node.SourceType.Should().Be("InlineConnector");
    }

    private static CanonicalObject BuildItem(
        string objectId = "cmp-1",
        string objectType = GraphNodeTypes.TopologyResource,
        string name = "test-item",
        string sourceType = "Test",
        string sourceId = "s1",
        Dictionary<string, string>? properties = null)
    {
        return new CanonicalObject
        {
            ObjectId = objectId,
            ObjectType = objectType,
            Name = name,
            SourceType = sourceType,
            SourceId = sourceId,
            Properties = properties ?? []
        };
    }
}
