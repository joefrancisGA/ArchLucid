using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Api.Models;

/// <summary>Full run detail payload returned by the run detail endpoint.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunDetailsResponse
{
    public ArchitectureRun Run
    {
        get;
        set;
    } = new();

    /// <summary>
    ///     Short sponsor-safe summary of agent execution (simulator vs real vs fallback), derived from the persisted run
    ///     and <c>AgentExecution:Mode</c> on the host at request time.
    /// </summary>
    public string? ExecutionFlavorBuyerSummary
    {
        get;
        set;
    }

    public List<AgentTask> Tasks
    {
        get;
        set;
    } = [];

    public List<AgentResult> Results
    {
        get;
        set;
    } = [];

    public GoldenManifest? Manifest
    {
        get;
        set;
    }

    public List<DecisionTrace> DecisionTraces
    {
        get;
        set;
    } = [];
}
