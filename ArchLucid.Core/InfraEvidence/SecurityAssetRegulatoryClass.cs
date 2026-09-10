namespace ArchLucid.Core.InfraEvidence;

/// <summary>Human-asserted regulatory class for a cloud resource (SA-18).</summary>
public enum SecurityAssetRegulatoryClass
{
    None = 0,
    Hipaa = 1,
    Pci = 2,
    FedRamp = 3,
    Other = 99,
}
