using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.GoldenCorpus;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Optional real-LLM JSON structural validation for golden-cohort drift.
/// </summary>
internal static class GoldenCohortDriftStructuralCheck
{
    internal static List<GoldenCohortDriftStructuralFailure> ValidateStructuralResults(
        GoldenCohortItem item,
        string runId,
        List<object> rawResults)
    {
        List<GoldenCohortDriftStructuralFailure> failures = [];

        for (int ri = 0; ri < rawResults.Count; ri++)
        {
            object raw = rawResults[ri];
            string resultJson = JsonSerializer.Serialize(raw, ContractJson.Default);
            AgentResult? r = JsonSerializer.Deserialize<AgentResult>(resultJson, ContractJson.Default);

            if (r is null)
                continue;

            RealLlmStructuralValidationResult validation =
                RealLlmOutputStructuralValidator.ValidateAgentResultStructure(r.AgentType.ToString(), resultJson);

            if (validation.IsValid)
                continue;

            failures.Add(
                new GoldenCohortDriftStructuralFailure
                {
                    CohortItemId = item.Id,
                    RunId = runId,
                    Code = "structuralValidation",
                    Message = "One or more structural checks failed for an agent result.",
                    AgentType = r.AgentType.ToString(),
                    ResultId = r.ResultId,
                    Validation = validation,
                });
        }

        return failures;
    }

    internal static GoldenCohortDriftStructuralFailure RealModeFallbackFailure(
        GoldenCohortItem item,
        string runId) =>
        new()
        {
            CohortItemId = item.Id,
            RunId = runId,
            Code = "realModeFellBackToSimulator",
            Message =
                "Run recorded RealModeFellBackToSimulator=true; strict-real cannot validate real-LLM JSON shape.",
        };
}

/// <summary>One structural validation failure surfaced by <c>golden-cohort drift</c>.</summary>
internal sealed class GoldenCohortDriftStructuralFailure
{
    public string? Code
    {
        get;
        set;
    }

    public string? Message
    {
        get;
        set;
    }

    public string? CohortItemId
    {
        get;
        set;
    }

    public string? RunId
    {
        get;
        set;
    }

    public string? AgentType
    {
        get;
        set;
    }

    public string? ResultId
    {
        get;
        set;
    }

    public RealLlmStructuralValidationResult? Validation
    {
        get;
        set;
    }
}
