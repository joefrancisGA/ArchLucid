using System.Text.Json;

using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

/// <summary>Guards JSON shapes for outbound integration events (additive fields allowed; required names/types should stay stable).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventPayloadContractTests
{
    [Fact]
    public void AuthorityRunCompleted_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            runId = Guid.NewGuid(),
            manifestId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
        };

        AssertContract(
            payload,
            "schemaVersion",
            "runId",
            "manifestId",
            "tenantId",
            "workspaceId",
            "projectId");
    }

    [Fact]
    public void GovernanceApprovalSubmitted_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            approvalRequestId = "a",
            runId = "r",
            manifestVersion = "v",
            sourceEnvironment = "dev",
            targetEnvironment = "test",
            requestedBy = "u",
        };

        AssertContract(
            payload,
            "schemaVersion",
            "approvalRequestId",
            "runId",
            "manifestVersion",
            "sourceEnvironment",
            "targetEnvironment",
            "requestedBy");
    }

    [Fact]
    public void GovernancePromotionActivated_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            activationId = "x",
            runId = "r",
            manifestVersion = "v",
            environment = "prod",
            activatedBy = "u",
            activatedUtc = DateTime.UtcNow,
        };

        AssertContract(
            payload,
            "schemaVersion",
            "activationId",
            "runId",
            "environment",
            "activatedBy",
            "activatedUtc");
    }

    [Fact]
    public void AlertFired_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            alertId = Guid.NewGuid(),
            runId = (Guid?)Guid.NewGuid(),
            comparedToRunId = (Guid?)null,
            ruleId = "rule",
            category = "c",
            severity = "High",
            title = "t",
            deduplicationKey = "k",
        };

        AssertContract(payload, "schemaVersion", "alertId", "ruleId", "severity", "title", "deduplicationKey");
    }

    [Fact]
    public void AlertResolved_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            alertId = Guid.NewGuid(),
            runId = (Guid?)null,
            resolvedByUserId = "u",
            comment = (string?)null,
        };

        AssertContract(payload, "schemaVersion", "alertId", "resolvedByUserId");
    }

    [Fact]
    public void AdvisoryScanCompleted_payload_has_expected_contract()
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            scheduleId = Guid.NewGuid(),
            executionId = Guid.NewGuid(),
            hasRuns = true,
            runId = (Guid?)null,
            comparedToRunId = (Guid?)null,
            digestId = (Guid?)null,
            completedUtc = DateTime.UtcNow,
        };

        AssertContract(payload, "schemaVersion", "scheduleId", "executionId", "hasRuns", "completedUtc");
    }

    private static void AssertContract(object payload, params string[] requiredProperties)
    {
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(payload, IntegrationEventJson.Options);
        using JsonDocument doc = JsonDocument.Parse(utf8);
        JsonElement root = doc.RootElement;

        root.ValueKind.Should().Be(JsonValueKind.Object);

        foreach (string name in requiredProperties)
        {
            root.TryGetProperty(name, out JsonElement _).Should().BeTrue(because: $"property {name} must exist for consumers");
        }
    }
}
