using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Jobs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Maps outbound create outcomes to background job files and worker retry policy (TB-394).</summary>
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

        string providerLabel = provider is ItsmOutboundIssueProvider.Jira ? "Jira" : "ServiceNow";

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

    /// <summary>When <see langword="true" />, the worker throws so <see cref="ArchLucid.Host.Core.Jobs.IBackgroundJobQueue" /> can retry/DLQ.</summary>
    public static bool ShouldRetryWorker(ItsmOutboundIssueCreationResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.Kind is ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed)
            return true;

        if (result.Kind is not ItsmOutboundCreateTerminalKind.VendorError)
            return false;

        int? code = result.VendorStatusCode;

        if (code is 429)
            return true;

        if (code is >= 500 and <= 599)
            return true;

        return false;
    }

    public static InvalidOperationException BuildRetryException(ItsmOutboundCreateJobResult result) =>
        new(result.UserMessage ?? "ITSM outbound create failed; retry scheduled.");
}
