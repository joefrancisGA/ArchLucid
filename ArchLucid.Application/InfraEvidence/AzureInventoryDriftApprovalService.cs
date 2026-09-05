using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryDriftApprovalService(
    IAzureInventoryDiffRepository diffRepository,
    IAzureInventoryDriftApprovalRepository driftApprovalRepository,
    ILogger<AzureInventoryDriftApprovalService> logger) : IAzureInventoryDriftApprovalService
{
    public async Task<AzureInventoryDriftApprovalCreateResult> TryCreateApprovalAsync(
        ScopeContext scope,
        Guid diffId,
        Guid? changeId,
        string approver,
        string reason,
        string? ticketReference,
        DateTime expirationUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(approver))
        {
            return new AzureInventoryDriftApprovalCreateResult
            {
                Succeeded = false,
                ErrorMessage = "Approver is required.",
            };
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            return new AzureInventoryDriftApprovalCreateResult
            {
                Succeeded = false,
                ErrorMessage = "Reason is required.",
            };
        }

        DateTime asOfUtc = TimeProvider.System.UtcNowDateTime();

        if (expirationUtc <= asOfUtc)
        {
            return new AzureInventoryDriftApprovalCreateResult
            {
                Succeeded = false,
                ErrorMessage = "ExpirationUtc must be in the future.",
            };
        }

        try
        {
            await driftApprovalRepository.MarkExpiredAsync(scope.TenantId, asOfUtc, cancellationToken);

            AzureInventoryDiffSummaryRecord? summary =
                await diffRepository.TryGetByDiffIdAsync(scope, diffId, cancellationToken);

            if (summary is null)
            {
                return new AzureInventoryDriftApprovalCreateResult
                {
                    Succeeded = false,
                    ErrorMessage = "Diff was not found in the current scope.",
                };
            }

            if (changeId.HasValue)
            {
                IReadOnlyList<AzureInventoryChangeRecord> changes =
                    await diffRepository.ListChangesByDiffIdAsync(scope, diffId, cancellationToken);

                if (changes.All(change => change.ChangeId != changeId.Value))
                {
                    return new AzureInventoryDriftApprovalCreateResult
                    {
                        Succeeded = false,
                        ErrorMessage = "ChangeId was not found on the specified diff.",
                    };
                }
            }

            Guid approvalId = Guid.NewGuid();

            AzureInventoryDriftApprovalRecord record = new()
            {
                ApprovalId = approvalId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DiffId = diffId,
                ChangeId = changeId,
                Approver = approver.Trim(),
                Reason = reason.Trim(),
                TicketReference = ticketReference,
                ExpirationUtc = expirationUtc,
                Status = AzureInventoryDriftApprovalStatus.Active,
                CreatedUtc = asOfUtc,
            };

            await driftApprovalRepository.InsertAsync(record, cancellationToken);

            return new AzureInventoryDriftApprovalCreateResult
            {
                Succeeded = true,
                ApprovalId = approvalId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Drift approval creation failed for DiffId={DiffId}.", diffId);

            return new AzureInventoryDriftApprovalCreateResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
