using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Vendor plugin for outbound external ticket create and browse URL (TB-397).</summary>
public interface IExternalTicketConnector
{
    ItsmOutboundIssueProvider ProviderId { get; }

    string ProviderLabel { get; }

    string CreateFailedAuditEventType { get; }

    string CreateSkippedAuditEventType { get; }

    string CreateSucceededAuditEventType { get; }

    Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ExternalTicketCreateContext context,
        CancellationToken cancellationToken);

    Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken);

    Task<ExternalTicketConnectorConfigValidationResult> ValidateConfigurationAsync(
        Guid tenantId,
        CancellationToken cancellationToken);
}
