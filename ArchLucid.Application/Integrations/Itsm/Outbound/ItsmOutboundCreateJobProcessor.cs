using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Jobs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Maps outbound create outcomes to background job result files (TB-394).</summary>
public static class ItsmOutboundCreateJobProcessor
{
    private static readonly JsonSerializerOptions JobResultJsonOptions = new(AuditJsonSerializationOptions.Instance)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    public static ScopeContext ToScopeContext(ItsmOutboundCreateJobPayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        return new ScopeContext
        {
            TenantId = payload.TenantId,
            WorkspaceId = payload.WorkspaceId,
            ProjectId = payload.ProjectId
        };
    }

    public static ItsmOutboundCreateJobResult ToJobResult(ItsmOutboundIssueCreationResult result, ItsmOutboundIssueProvider provider)
    {
        ArgumentNullException.ThrowIfNull(result);

        string providerLabel = provider switch
        {
            ItsmOutboundIssueProvider.Jira => "Jira",
            ItsmOutboundIssueProvider.ServiceNow => "ServiceNow",
            ItsmOutboundIssueProvider.AzureBoards => "Azure Boards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null),
        };

        return new ItsmOutboundCreateJobResult(
            result.Kind,
            providerLabel,
            result.ExternalKey,
            result.UserMessage,
            result.VendorStatusCode);
    }

    public static BackgroundJobFile ToResultFile(ItsmOutboundCreateJobResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(result, JobResultJsonOptions);

        return new BackgroundJobFile("itsm-outbound-create-result.json", "application/json", bytes);
    }
}
