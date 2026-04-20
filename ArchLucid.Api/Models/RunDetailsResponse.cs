using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Api.Models;

/// <summary>Full run detail payload returned by the run detail endpoint.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunDetailsResponse
{
    public ArchitectureRun Run { get; set; } = new();
    public List<AgentTask> Tasks { get; set; } = [];
    public List<AgentResult> Results { get; set; } = [];
    public GoldenManifest? Manifest
    {
        get; set;
    }
    public List<DecisionTrace> DecisionTraces { get; set; } = [];
}
