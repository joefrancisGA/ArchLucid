using ArchLucid.ContextIngestion.Topology;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Topology Hint Stable Object Ids.
/// </summary>
[Trait("Category", "Unit")]
public sealed class TopologyHintStableObjectIdsTests
{
    [Fact]
    public void FromHintName_IsDeterministic()
    {
        string a = TopologyHintStableObjectIds.FromHintName("hub-vnet");
        string b = TopologyHintStableObjectIds.FromHintName("hub-vnet");

        a.Should().Be(b);
        a.Should().HaveLength(32);
    }

    [Fact]
    public void FromHintName_DifferentHints_Differ()
    {
        string a = TopologyHintStableObjectIds.FromHintName("a");
        string b = TopologyHintStableObjectIds.FromHintName("b");

        a.Should().NotBe(b);
    }

    [Fact]
    public void CanonicalizeHintName_ThreeSegmentInnerSlashSpacing_EquivalentPathsMatch()
    {
        string spaced = TopologyHintStableObjectIds.CanonicalizeHintName("prod / vnet / subnet-a");
        string compact = TopologyHintStableObjectIds.CanonicalizeHintName("prod/vnet/subnet-a");

        spaced.Should().Be(compact);
        TopologyHintStableObjectIds.FromHintName(spaced).Should().Be(TopologyHintStableObjectIds.FromHintName(compact));
    }

    [Fact]
    public void CanonicalizeHintName_InternalWhitespace_EquivalentHintsMatch()
    {
        string spaced = TopologyHintStableObjectIds.CanonicalizeHintName("hub  vnet");
        string compact = TopologyHintStableObjectIds.CanonicalizeHintName("hub vnet");

        spaced.Should().Be(compact);
        TopologyHintStableObjectIds.FromHintName(spaced).Should().Be(TopologyHintStableObjectIds.FromHintName(compact));
    }
}
