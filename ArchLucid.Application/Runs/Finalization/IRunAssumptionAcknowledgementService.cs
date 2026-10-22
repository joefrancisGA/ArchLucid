using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Server-persisted pre-finalize assumption acknowledgements (TB-2345 item 49).</summary>
public interface IRunAssumptionAcknowledgementService
{
    /// <summary>Current acknowledgement document; an empty document when nothing has been acknowledged yet.</summary>
    Task<RunAssumptionAcknowledgementDocument> GetAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken);

    /// <summary>Replaces the acknowledged id set. Throws <c>ConflictException</c> once the run is sealed.</summary>
    Task<RunAssumptionAcknowledgementDocument> PutAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyCollection<string> acknowledgedAssumptionIds,
        CancellationToken cancellationToken);

    /// <summary>Acknowledged ids only, for the commit gate; empty when the run has no document.</summary>
    Task<IReadOnlySet<string>> GetAcknowledgedIdsAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken);
}
