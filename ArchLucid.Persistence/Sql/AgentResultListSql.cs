namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Documents intentional agent-result list SQL shapes for TB-929 inventory / shape guards.
///     Slim first-paint without <c>ResultJson</c> is tracked under <c>TB-930</c>.
/// </summary>
internal static class AgentResultListSql
{
    /// <summary>
    ///     <c>GetByRunIdAsync</c> still loads full <c>ResultJson</c> for commit/detail orchestration.
    /// </summary>
    public const string GetByRunIdSelectResultJson = "SELECT ar.ResultJson";

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
