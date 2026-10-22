namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Idempotently persists coordinator <c>IDecisionEngineV2</c> decision nodes after authority commit (TB-2060).
///     EK-08: this is an unused appendix for GET decisions. Nodes are not fed into
///     <c>IDecisionEngine.DecideAsync</c> and do not produce <c>ManifestDocument</c>.
/// </summary>
public interface IDecisionEngineV2NodeMaterializer
{
    /// <summary>
    ///     Creates decision nodes for <paramref name="runId" /> when none exist so
    ///     <c>GET /v1/architecture/review/{runId}/decisions</c> is populated.
    /// </summary>
    Task MaterializeIfMissingAsync(string runId, CancellationToken cancellationToken);
}
