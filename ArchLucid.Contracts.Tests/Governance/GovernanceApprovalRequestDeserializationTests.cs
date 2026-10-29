using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceApprovalRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_status_yields_draft_not_null()
    {
        const string json = """
            {
              "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "workspaceId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "status": null
            }
            """;

        GovernanceApprovalRequest? request =
            JsonSerializer.Deserialize<GovernanceApprovalRequest>(json, ContractJson.CamelCaseCompact);

        request.Should().NotBeNull();
        request!.Status.Should().Be(GovernanceApprovalStatus.Draft);
    }
}
