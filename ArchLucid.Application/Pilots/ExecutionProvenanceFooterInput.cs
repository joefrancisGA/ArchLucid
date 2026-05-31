using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Pilots;

/// <summary>Inputs for the first-value report execution provenance footer (pilot try --real path).</summary>
public sealed record ExecutionProvenanceFooterInput(
    StructuralExecutionMode PersistedStructuralExecutionMode,
    bool RealModeFellBackToSimulator,
    string? PilotAoaiDeploymentSnapshot,
    string HostAgentExecutionMode,
    string? HostAzureOpenAiDeploymentName,
    int LlmCompletionTraceCount);
