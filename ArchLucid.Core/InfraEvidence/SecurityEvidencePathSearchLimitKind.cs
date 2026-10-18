namespace ArchLucid.Core.InfraEvidence;

/// <summary>Which enumerator cap stopped attack-path search.</summary>
public enum SecurityEvidencePathSearchLimitKind
{
    MaxPaths = 0,
    MaxDepth = 1,
    MaxFanOut = 2,
}
