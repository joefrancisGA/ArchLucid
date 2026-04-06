using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class CreateArchitectureRunResponse
{
    public ArchitectureRun Run { get; set; } = new();
    public EvidenceBundle EvidenceBundle { get; set; } = new();
    public List<AgentTask> Tasks { get; set; } = [];
}
