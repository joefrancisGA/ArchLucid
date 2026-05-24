using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Append-only writes to <c>dbo.AgentOutputEvaluations</c> for prompt variant analytics.</summary>
public interface IAgentOutputEvaluationRepository
{
    Task AppendAsync(AgentOutputEvaluationInsert row, CancellationToken cancellationToken = default);
}

/// <summary>Row inserted after post-run agent output quality evaluation.</summary>
public sealed class AgentOutputEvaluationInsert
{
    public string? ResultId
    {
        get;
        init;
    }

    public required string RunId
    {
        get;
        init;
    }

    public required string PromptTemplateName
    {
        get;
        init;
    }

    public required string PromptVariantKey
    {
        get;
        init;
    }

    public AgentType AgentType
    {
        get;
        init;
    }

    public double SemanticScore
    {
        get;
        init;
    }

    public bool QualityGatePassed
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
