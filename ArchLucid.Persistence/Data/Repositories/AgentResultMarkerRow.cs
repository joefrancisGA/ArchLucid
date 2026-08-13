using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Dapper projection for agent-type grounding markers (TB-930) — identity and confidence only.</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class AgentResultMarkerRow
{
    public string ResultId
    {
        get;
        init;
    } = null!;

    public string TaskId
    {
        get;
        init;
    } = null!;

    /// <summary><c>dbo.AgentResults.RunId</c> is <c>UNIQUEIDENTIFIER</c>; mapping to string here throws in Dapper.</summary>
    public Guid RunId
    {
        get;
        init;
    }

    public string AgentType
    {
        get;
        init;
    } = null!;

    public double Confidence
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
