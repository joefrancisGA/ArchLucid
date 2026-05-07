using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;

namespace ArchLucid.Application.Alerts;
public sealed class AlertActionLoopReader(IAlertRecordRepository alertRepository, IAlertDeliveryAttemptRepository deliveryAttemptRepository) : IAlertActionLoopReader
{
    private readonly IAlertRecordRepository _alertRepository = alertRepository ?? throw new ArgumentNullException(nameof(alertRepository));
    private readonly IAlertDeliveryAttemptRepository _deliveryAttemptRepository = deliveryAttemptRepository ?? throw new ArgumentNullException(nameof(deliveryAttemptRepository));
    /// <inheritdoc/>
    public async System.Threading.Tasks.Task<ArchLucid.Application.Alerts.AlertActionLoopSnapshot?> GetAsync(Guid alertId, ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        AlertRecord? alert = await _alertRepository.GetByIdAsync(alertId, cancellationToken).ConfigureAwait(false);
        if (alert is null || alert.TenantId != scope.TenantId || alert.WorkspaceId != scope.WorkspaceId || alert.ProjectId != scope.ProjectId)
            return null;
        IReadOnlyList<AlertDeliveryAttempt> attempts = await _deliveryAttemptRepository.ListByAlertAsync(alertId, cancellationToken).ConfigureAwait(false);
        List<AlertDeliveryAttemptSummary> rows = attempts.Select(static a => new AlertDeliveryAttemptSummary { ChannelType = a.ChannelType, Status = a.Status, AttemptedUtc = new DateTimeOffset(DateTime.SpecifyKind(a.AttemptedUtc, DateTimeKind.Utc), TimeSpan.Zero), DestinationRedacted = IntegrationDestinationRedactor.Redact(a.Destination), ErrorMessage = a.ErrorMessage, }).ToList();
        return new AlertActionLoopSnapshot
        {
            AlertId = alert.AlertId,
            Status = alert.Status,
            RunId = alert.RunId,
            LastUpdatedUtc = alert.LastUpdatedUtc is null ? null : new DateTimeOffset(DateTime.SpecifyKind(alert.LastUpdatedUtc.Value, DateTimeKind.Utc), TimeSpan.Zero),
            ResolutionComment = alert.ResolutionComment,
            DeliveryAttempts = rows,
        };
    }
}