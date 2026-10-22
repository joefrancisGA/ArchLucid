using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Maps agent-result projection rows onto <see cref="AgentResult" />. Rows whose persisted <c>AgentType</c> no longer
///     matches a known agent are skipped rather than failing the read, so retiring an agent type does not break history.
/// </summary>
internal static class AgentResultProjectionMapper
{
    public static List<AgentResult> MapMarkers(IEnumerable<AgentResultMarkerRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);

        List<AgentResult> markers = [];

        foreach (AgentResultMarkerRow row in rows)
        {
            if (!TryParseAgentType(row.AgentType, out AgentType agentType))
                continue;

            markers.Add(new AgentResult
            {
                ResultId = row.ResultId,
                TaskId = row.TaskId,
                RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
                AgentType = agentType,
                Confidence = row.Confidence,
                CreatedUtc = row.CreatedUtc,
            });
        }

        return markers;
    }

    public static List<AgentResult> MapRollupProjection(
        IEnumerable<AgentResultRollupProjectionRow> rows,
        string runId)
    {
        ArgumentNullException.ThrowIfNull(rows);

        List<AgentResult> projected = [];

        foreach (AgentResultRollupProjectionRow row in rows)
        {
            if (!TryParseAgentType(row.AgentType, out AgentType agentType))
                continue;

            AgentResult result = new()
            {
                ResultId = row.ResultId,
                TaskId = row.TaskId,
                RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
                AgentType = agentType,
                Confidence = row.Confidence,
                CreatedUtc = row.CreatedUtc,
                Claims = AgentResultRollupJsonReader.ReadClaims(row.ClaimsJson, runId),
                EvidenceRefs = AgentResultRollupJsonReader.ReadStringList(row.EvidenceRefsJson, runId, "evidenceRefs"),
                Findings = AgentResultRollupJsonReader.ReadFindings(row.FindingsJson, runId),
                ProposedChanges = AgentResultRollupJsonReader.ReadProposedChanges(
                    row.RequiredControlsJson,
                    row.WarningsJson,
                    runId),
            };

            projected.Add(AgentResultRollupProjection.StripHeavyFields(result));
        }

        return projected;
    }

    public static EvidenceProposalListItem MapEvidenceProposal(AgentResultEvidenceProposalRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new EvidenceProposalListItem
        {
            ResultId = row.ResultId,
            RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
            AgentType = row.AgentType,
            ProposedEvidenceJson = row.ProposedEvidenceJson,
            CreatedUtc = row.CreatedUtc,
            IsPromoted = row.IsPromoted,
        };
    }

    private static bool TryParseAgentType(string? persistedAgentType, out AgentType agentType) =>
        Enum.TryParse(persistedAgentType, ignoreCase: true, out agentType);
}
