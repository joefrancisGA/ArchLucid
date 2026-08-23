using System.Text.Json;

using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

/// <summary>
///     Guards CLI simulate-webhook synthetic payloads against committed integration-event schemas.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationWebhookPayloadSamplesTests
{
    [Fact]
    public void CreatePayload_governance_approval_submitted_matches_committed_schema()
    {
        object payload = IntegrationWebhookPayloadSamples.CreatePayload(
            IntegrationEventTypes.GovernanceApprovalSubmittedV1);

        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(payload, IntegrationEventJson.Options);

        using JsonDocument document = JsonDocument.Parse(utf8);
        JsonElement root = document.RootElement;

        string[] required =
        [
            "schemaVersion",
            "tenantId",
            "workspaceId",
            "projectId",
            "approvalRequestId",
            "runId",
            "manifestVersion",
            "sourceEnvironment",
            "targetEnvironment",
            "requestedBy"
        ];

        foreach (string name in required)
        {
            root.TryGetProperty(name, out _).Should().BeTrue($"required property '{name}' must exist");
        }

        root.TryGetProperty("submittedBy", out _).Should().BeFalse("publisher uses requestedBy, not submittedBy");
    }
}
