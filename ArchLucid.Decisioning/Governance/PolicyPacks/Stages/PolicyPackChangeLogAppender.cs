using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

/// <summary>Append-only policy pack change log writes shared across mutation stages.</summary>
public interface IPolicyPackChangeLogAppender
{
    Task AppendAsync(
        Guid policyPackId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string changeType,
        string changedBy,
        string? previousValue,
        string? newValue,
        string? summaryText,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);
}

/// <inheritdoc cref="IPolicyPackChangeLogAppender" />
public sealed class PolicyPackChangeLogAppender(
    IPolicyPackChangeLogRepository changeLogRepository,
    ILogger<PolicyPackChangeLogAppender> logger) : IPolicyPackChangeLogAppender
{
    internal static readonly JsonSerializerOptions ChangeLogJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly IPolicyPackChangeLogRepository _changeLogRepository =
        changeLogRepository ?? throw new ArgumentNullException(nameof(changeLogRepository));

    private readonly ILogger<PolicyPackChangeLogAppender> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task AppendAsync(
        Guid policyPackId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string changeType,
        string changedBy,
        string? previousValue,
        string? newValue,
        string? summaryText,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(changeType);
        ArgumentException.ThrowIfNullOrWhiteSpace(changedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(summaryText);

        PolicyPackChangeLogEntry entry = new()
        {
            PolicyPackId = policyPackId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            ChangeType = changeType,
            ChangedBy = changedBy,
            ChangedUtc = TimeProvider.System.UtcNowDateTime(),
            PreviousValue = previousValue,
            NewValue = newValue,
            SummaryText = summaryText,
        };

        try
        {
            await _changeLogRepository.AppendAsync(entry, ct, connection, transaction);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Policy pack change log append failed for PolicyPackId={PolicyPackId}, ChangeType={ChangeType}. Primary mutation already completed.",
                policyPackId,
                changeType);
        }
    }
}
