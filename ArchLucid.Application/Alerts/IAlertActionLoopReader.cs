using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;

namespace ArchLucid.Application.Alerts;

public interface IAlertActionLoopReader
{
    Task<AlertActionLoopSnapshot?> GetAsync(Guid alertId, ScopeContext scope, CancellationToken cancellationToken);
}
