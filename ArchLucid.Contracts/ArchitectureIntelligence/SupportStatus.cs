namespace ArchLucid.Contracts.ArchitectureIntelligence;

public enum SupportStatus
{
    DirectlyEstablished = 0,
    IndirectlySupported = 1,
    PartiallySupported = 2,
    Unsupported = 3,
    Contradicted = 4,
    Conflicting = 5,
    NotYetEvaluated = 6,
}
