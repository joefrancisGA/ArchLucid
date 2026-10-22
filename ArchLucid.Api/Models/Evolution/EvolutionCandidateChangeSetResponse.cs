using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Evolution;

/// <summary>API projection of a 60R candidate change set.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class EvolutionCandidateChangeSetResponse
{
    public Guid CandidateChangeSetId
    {
        get;
        init;
    }

    public Guid SourcePlanId
    {
        get;
        init;
    }

    public required string Status
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    public required string Summary
    {
        get;
        init;
    }

    public required string DerivationRuleVersion
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public string? CreatedByUserId
    {
        get;
        init;
    }
}
