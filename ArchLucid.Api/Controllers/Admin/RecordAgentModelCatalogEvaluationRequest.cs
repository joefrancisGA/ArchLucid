using ArchLucid.Core.Agents;

namespace ArchLucid.Api.Controllers.Admin;

public sealed class RecordAgentModelCatalogEvaluationRequest
{
    public string EvaluationState { get; set; } = nameof(AgentModelEvaluationStateKind.NotEvaluated);

    public string? EvidenceJson { get; set; }
}
