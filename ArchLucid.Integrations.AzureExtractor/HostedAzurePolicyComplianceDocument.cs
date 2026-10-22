using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Policy Insights latest states document aligned with Tier 1 <c>policy-compliance.json</c>.
/// </summary>
public sealed class HostedAzurePolicyComplianceDocument
{
    public int PolicyComplianceSchemaVersion { get; init; } = 1;

    public required string CollectionTimestampUtc { get; init; }

    public required string Scope { get; init; }

    public string ManagementPlane { get; init; } = "AzurePolicyInsights";

    public string ApiShape { get; init; } = "policyStates/latest/queryResults";

    public string? ReaderNote { get; init; }

    public int RecordCount { get; init; }

    public IReadOnlyList<JsonElement> Records { get; init; } = [];
}
