using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Learning;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class LearningPlanStepResponse
{
    public int Ordinal
    {
        get;
        init;
    }

    public string ActionType
    {
        get;
        init;
    } = string.Empty;

    public string Description
    {
        get;
        init;
    } = string.Empty;

    public string? AcceptanceCriteria
    {
        get;
        init;
    }
}
