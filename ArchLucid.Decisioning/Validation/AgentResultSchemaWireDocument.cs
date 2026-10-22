using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Decisioning.Validation;

/// <summary>
///     Schema-validation wire subset of <see cref="AgentResult" /> (matches <c>schemas/agentresult.schema.json</c>).
/// </summary>
internal sealed class AgentResultSchemaWireDocument
{
    public string ResultId
    {
        get;
        set;
    } = string.Empty;

    public string TaskId
    {
        get;
        set;
    } = string.Empty;

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public AgentType AgentType
    {
        get;
        set;
    }

    public List<string> Claims
    {
        get;
        set;
    } = [];

    public List<string> EvidenceRefs
    {
        get;
        set;
    } = [];

    public double Confidence
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public AgentTopologyProposal? ProposedChanges
    {
        get;
        set;
    }

    public static AgentResultSchemaWireDocument FromAgentResult(AgentResult result)
    {
        return new AgentResultSchemaWireDocument
        {
            ResultId = result.ResultId,
            TaskId = result.TaskId,
            RunId = result.RunId,
            AgentType = result.AgentType,
            Claims = result.Claims,
            EvidenceRefs = result.EvidenceRefs,
            Confidence = result.Confidence,
            CreatedUtc = result.CreatedUtc,
            ProposedChanges = result.ProposedChanges
        };
    }
}
