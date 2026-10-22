using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>
///     Shared correlation-persistence pipeline for external ticket connectors (Jira, ServiceNow).
/// </summary>
public abstract class ExternalTicketCreatePipeline
{
    protected abstract string PipelineProviderLabel { get; }

    protected abstract string PipelineCreateFailedAuditEventType { get; }

    protected abstract string PipelineCreateSucceededAuditEventType { get; }

    protected async Task<ItsmOutboundIssueCreationResult> RegisterCorrelationOrReturnPersistenceFailureAsync(
        IItsmFindingCorrelationRepository correlations,
        ScopeContext scope,
        FindingInspectResponse inspect,
        string externalKey,
        string? externalNumber,
        CancellationToken cancellationToken)
    {
        try
        {
            Guid? findingRecordId =
                await ExternalTicketConnectorSupport
                    .ResolveFindingRecordIdForInspectAsync(correlations, scope, inspect, cancellationToken)
                    .ConfigureAwait(false);

            await correlations.RegisterAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    inspect.FindingId,
                    PipelineProviderLabel,
                    externalKey,
                    externalNumber,
                    findingRecordId,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            AuditEvent ev = new()
            {
                EventType = PipelineCreateFailedAuditEventType,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    externalKey,
                    reason = "correlation_persist_failed",
                    error = ex.Message
                })
            };

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
                UserMessage = $"{PipelineProviderLabel} ticket was created but ArchLucid could not persist ITSM correlation.",
                ExternalKey = externalKey,
                AuditEvents = [ev]
            };
        }

        AuditEvent ok = new()
        {
            EventType = PipelineCreateSucceededAuditEventType,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = JsonSerializer.Serialize(new
            {
                findingId = inspect.FindingId,
                externalKey
            })
        };

        return new ItsmOutboundIssueCreationResult
        {
            Kind = ItsmOutboundCreateTerminalKind.Succeeded,
            ExternalKey = externalKey,
            UserMessage = $"{PipelineProviderLabel} ticket created.",
            AuditEvents = [ok]
        };
    }

    protected static ItsmOutboundIssueCreationResult Skipped(
        string createSkippedAuditEventType,
        ScopeContext scope,
        FindingInspectResponse inspect,
        string reason,
        string userMessage) =>
        new()
        {
            Kind = ItsmOutboundCreateTerminalKind.Skipped,
            UserMessage = userMessage,
            AuditEvents =
            [
                ExternalTicketConnectorSupport.SkippedAudit(createSkippedAuditEventType, scope, inspect, reason)
            ]
        };
}
