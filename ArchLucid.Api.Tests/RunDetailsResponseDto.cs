using ArchLucid.Api.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;

namespace ArchLucid.Api.Tests;

public sealed class RunDetailsResponseDto
{
    public ArchitectureRun Run
    {
        get;
        set;
    } = new();

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

    public RunTrustEvidenceCard? TrustEvidenceCard
    {
        get;
        set;
    }

    public RunAgentLlmCostEstimateResponse? AgentExecutionLlmCostEstimate
    {
        get;
        set;
    }
}
