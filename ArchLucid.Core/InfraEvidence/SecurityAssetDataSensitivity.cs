namespace ArchLucid.Core.InfraEvidence;

/// <summary>Human-asserted data sensitivity for a cloud resource (SA-18).</summary>
public enum SecurityAssetDataSensitivity
{
    Unspecified = 0,
    Public = 1,
    Internal = 2,
    Confidential = 3,
    Restricted = 4,
    Phi = 5,
}
