using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Interfaces;

public interface IDecisionTraceRepository
{
    Task SaveAsync(DecisionTrace trace, CancellationToken ct);
    Task<DecisionTrace?> GetByIdAsync(Guid decisionTraceId, CancellationToken ct);
}

