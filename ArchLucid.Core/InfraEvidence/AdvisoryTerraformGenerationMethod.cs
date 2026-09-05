namespace ArchLucid.Core.InfraEvidence;

/// <summary>How an advisory Terraform address was produced for a snapshot resource.</summary>
public enum AdvisoryTerraformGenerationMethod
{
    Unknown = 0,
    AztfexportPrimary = 1,
    SnapshotReconstruction = 2,
    HybridAztfexportAndReconstruction = 3,
}
