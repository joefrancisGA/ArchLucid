using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Manifest;
using ArchiForge.Contracts.Metadata;

namespace ArchiForge.Api.Models;

public sealed class ReplayRunResponse
{
    public string OriginalRunId { get; set; } = string.Empty;
    public string ReplayRunId { get; set; } = string.Empty;
    public string ExecutionMode { get; set; } = string.Empty;
    public List<AgentResult> Results { get; set; } = [];
    public GoldenManifest? Manifest { get; set; }
    public List<DecisionTrace> DecisionTraces { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
}
