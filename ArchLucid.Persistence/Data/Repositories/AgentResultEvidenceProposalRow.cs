using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Dapper projection for evidence-proposal reads (no <c>ResultJson</c>).</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class AgentResultEvidenceProposalRow
{
    public string ResultId
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

    public string ProposedEvidenceJson
    {
        get;
        init;
    } = null!;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public bool IsPromoted
    {
        get;
        init;
    }
}
