namespace ArchLucid.Core.Agents;

/// <summary>Where customer evidence may flow for a catalog engine (ADR 0065 D11, TB-2109).</summary>
public enum AgentModelDataBoundaryKind
{
    AzureBoundary = 0,
    ExternalSubprocessor = 1,
}
