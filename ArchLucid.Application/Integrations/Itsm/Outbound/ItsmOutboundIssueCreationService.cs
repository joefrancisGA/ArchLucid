using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Creates external tickets from authority findings via registered <see cref="IExternalTicketConnector" /> plugins (TB-397).</summary>
public sealed class ItsmOutboundIssueCreationService(
    IFindingInspectReadRepository findingInspectReadRepository,
    IItsmFindingCorrelationRepository correlations,
    ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
    IExternalTicketConnectorRegistry connectorRegistry,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IItsmOutboundIssueCreationService
{
    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmOutboundSettings =
        tenantItsmOutboundSettings ?? throw new ArgumentNullException(nameof(tenantItsmOutboundSettings));

    private readonly IExternalTicketConnectorRegistry _connectorRegistry =
        connectorRegistry ?? throw new ArgumentNullException(nameof(connectorRegistry));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    public async Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ItsmOutboundIssueProvider provider,
        ScopeContext scope,
        string findingId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findingId);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        IExternalTicketConnector connector = _connectorRegistry.GetRequired(provider);
        FindingInspectResponse? inspect =
            await _findingInspectReadRepository.GetInspectAsync(scope, findingId, ct).ConfigureAwait(false);

        if (inspect is null)
        {
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                UserMessage = "Finding was not found in the current scope.",
                AuditEvents =
                [
                    new AuditEvent
                    {
                        EventType = connector.CreateFailedAuditEventType,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        DataJson = JsonSerializer.Serialize(new { findingId = findingId.Trim(), reason = "finding_not_found" })
                    }
                ]
            };
        }

        await ItsmOutboundSealedManifestHashGuard.EnsureFindingRunReadyOrThrowAsync(
            inspect,
            scope,
            _authorityQueryService,
            _manifestHashService,
            ct).ConfigureAwait(false);

        FindingClassification? classification =
            ItsmFindingAuthorityPayloadMapper.TryGetClassification(inspect.TypedPayload);

        if (DecisionGradeFindingExportFilter.IsChecklistCoverageForExport(classification))
        {
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.NotDecisionGrade,
                UserMessage = DecisionGradeFindingExportFilter.ChecklistCoverageItsmExportBlockedMessage,
            };
        }

        ItsmFindingCorrelationRecord? existingCorrelation = await _correlations
            .TryGetByFindingAndProviderAsync(scope.TenantId, findingId.Trim(), connector.ProviderLabel, ct)
            .ConfigureAwait(false);

        if (existingCorrelation is not null)
        {
            AuditEvent duplicateAudit = ExternalTicketConnectorSupport.SkippedAudit(
                connector.CreateSkippedAuditEventType,
                scope,
                inspect,
                "duplicate_correlation_exists");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage =
                    $"A {connector.ProviderLabel} ticket is already linked to this finding ({existingCorrelation.ExternalKey}).",
                ExternalKey = existingCorrelation.ExternalKey,
                AuditEvents = [duplicateAudit]
            };
        }

        TenantItsmOutboundSettings? tenantRow =
            await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, ct).ConfigureAwait(false);
        FindingSeverity severity = ItsmFindingAuthorityPayloadMapper.TryGetSeverity(inspect.TypedPayload, inspect.Severity);
        (string summary, string description) = ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(
            inspect.FindingId,
            inspect.RunId,
            inspect.TypedPayload,
            inspect.DecisionRuleName,
            inspect.RecommendedActions,
            inspect.AssignedToUserId,
            inspect.RemediationDueUtc);

        ExternalTicketCreateContext createContext = new(
            scope,
            inspect,
            tenantRow,
            severity,
            summary,
            description);

        return await connector.TryCreateForFindingAsync(createContext, ct).ConfigureAwait(false);
    }
}
