namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Optional run-level context when resolving real-agent failure triage (e.g. first-value CLI fallback).
/// </summary>
public sealed class RealAgentFailureTriageContext
{
    public bool RealModeFellBackToSimulator { get; init; }
}
