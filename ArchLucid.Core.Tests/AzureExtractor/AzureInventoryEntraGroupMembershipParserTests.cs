using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEntraGroupMembershipParserTests
{
    [Fact]
    public void TryParse_valid_observed_fact_row_maps_fields()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "memberId": "11111111-1111-1111-1111-111111111111",
              "groupId": "22222222-2222-2222-2222-222222222222",
              "provenanceKind": "ObservedFact"
            }
            """);

        bool parsed = AzureInventoryEntraGroupMembershipParser.TryParse(
            document.RootElement,
            out AzureInventoryEntraGroupMembershipRow? row,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        row.Should().NotBeNull();
        row!.MemberId.Should().Be("11111111-1111-1111-1111-111111111111");
        row.GroupId.Should().Be("22222222-2222-2222-2222-222222222222");
        row.ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        row.EvidenceHashSha256.Should().NotBeNull();
        row.MemberNodeId.Should().Contain("11111111-1111-1111-1111-111111111111");
        row.GroupNodeId.Should().Contain("22222222-2222-2222-2222-222222222222");
    }

    [Fact]
    public void TryParse_missing_group_id_is_rejected()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "memberId": "11111111-1111-1111-1111-111111111111"
            }
            """);

        bool parsed = AzureInventoryEntraGroupMembershipParser.TryParse(
            document.RootElement,
            out _,
            out string? error);

        parsed.Should().BeFalse();
        error.Should().Contain("groupId");
    }
}
