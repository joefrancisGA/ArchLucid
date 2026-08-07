namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Documents intentional agent-result list SQL shapes for TB-929 inventory / shape guards.
///     Slim first-paint without <c>ResultJson</c> is tracked under <c>TB-930</c>.
///     Rollup/compare projection (TB-2053) omits bare full-row <c>ResultJson</c>.
/// </summary>
internal static class AgentResultListSql
{
    /// <summary>
    ///     <c>GetByRunIdAsync</c> still loads full <c>ResultJson</c> for commit/detail orchestration.
    /// </summary>
    public const string GetByRunIdSelectResultJson = "SELECT ar.ResultJson";

    /// <summary>
    ///     Buyer-summary grounding markers (TB-930) — agent types without <c>ResultJson</c>.
    /// </summary>
    public const string GetByRunIdSelectAgentTypeMarkers = """
                                                           SELECT ar.ResultId, ar.TaskId, ar.RunId, ar.AgentType, ar.Confidence, ar.CreatedUtc
                                                           """;

    /// <summary>
    ///     Rollup/compare projection (TB-2053) — relational identity plus JSON subpaths used by diffs / severity
    ///     rollups. Must not SELECT bare <c>ar.ResultJson</c> (reasoning / topology LOBs stay in storage).
    /// </summary>
    public const string GetByRunIdSelectRollupProjection = """
                                                           SELECT ar.ResultId,
                                                                  ar.TaskId,
                                                                  ar.RunId,
                                                                  ar.AgentType,
                                                                  ar.Confidence,
                                                                  ar.CreatedUtc,
                                                                  JSON_QUERY(ar.ResultJson, '$.claims') AS ClaimsJson,
                                                                  JSON_QUERY(ar.ResultJson, '$.evidenceRefs') AS EvidenceRefsJson,
                                                                  JSON_QUERY(ar.ResultJson, '$.findings') AS FindingsJson,
                                                                  JSON_QUERY(ar.ResultJson, '$.proposedChanges.requiredControls') AS RequiredControlsJson,
                                                                  JSON_QUERY(ar.ResultJson, '$.proposedChanges.warnings') AS WarningsJson
                                                           """;

    /// <summary>
    ///     Evidence-proposal list needs <c>ProposedEvidenceJson</c> by purpose; must omit <c>ResultJson</c>.
    /// </summary>
    public const string ListEvidenceProposalsSelectColumns = """
                                                             ar.ResultId,
                                                             ar.RunId,
                                                             ar.AgentType,
                                                             ar.ProposedEvidenceJson,
                                                             ar.CreatedUtc
                                                             """;
}
