using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

public sealed record InsightGeneratorProposal(
    string Title,
    string Rationale,
    FindingSeverity Severity,
    string Category,
    IReadOnlyList<string> EvidenceRefs);
