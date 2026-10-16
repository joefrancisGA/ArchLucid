using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Evolution;

[Trait("Category", "Unit")]
public sealed class ApprovalStatusDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_approval_status_throws()
    {
        const string json = """
            {
              "changeSetId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "sourcePlanId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "description": "test",
              "approvalStatus": 99,
              "createdUtc": "2026-10-14T00:00:00Z"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<CandidateChangeSet>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_approval_status_throws()
    {
        const string json = """
            {
              "changeSetId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "sourcePlanId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "description": "test",
              "approvalStatus": "99",
              "createdUtc": "2026-10-14T00:00:00Z"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<CandidateChangeSet>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_approval_status()
    {
        const string json = """
            {
              "changeSetId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "sourcePlanId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "description": "test",
              "approvalStatus": 2,
              "createdUtc": "2026-10-14T00:00:00Z"
            }
            """;

        CandidateChangeSet changeSet = JsonSerializer.Deserialize<CandidateChangeSet>(json, ContractJson.Default)!;

        changeSet.ApprovalStatus.Should().Be(ApprovalStatus.Approved);
    }
}
