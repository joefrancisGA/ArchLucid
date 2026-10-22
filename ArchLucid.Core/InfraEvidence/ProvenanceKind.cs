namespace ArchLucid.Core.InfraEvidence;

/// <summary>Provenance classification for infrastructure-evidence claims.</summary>
public enum ProvenanceKind
{
    ObservedFact = 0,
    DerivedFact = 1,
    DeterministicInference = 2,
    AiInference = 3,
    HumanAssertion = 4,
}
