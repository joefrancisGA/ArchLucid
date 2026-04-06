using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application;

public sealed class ReplayRunResult
{
    public string OriginalRunId { get; set; } = string.Empty;
    public string ReplayRunId { get; set; } = string.Empty;
    public string ExecutionMode { get; set; } = string.Empty;
    public List<AgentResult> Results { get; set; } = [];
    public GoldenManifest? Manifest { get; set; }
    public List<DecisionTrace> DecisionTraces { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
}
