using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Alerts;

public interface IAlertActionLoopReader
{
    Task<AlertActionLoopSnapshot?> GetAsync(Guid alertId, ScopeContext scope, CancellationToken cancellationToken);
}
