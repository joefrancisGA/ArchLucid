namespace ArchLucid.Core.AzureExtractor;

/// <summary>Azure Virtual Desktop resource categories isolated by NR-06 view filtering.</summary>
public enum InventoryDiagramAvdCategory
{
    HostPool = 0,
    ApplicationGroup = 1,
    Workspace = 2,
    ScalingPlan = 3,
    SessionHost = 4,
    ImageDefinition = 5,
    ImageTemplate = 6,
    SessionHostVirtualMachine = 7,
    SessionHostVirtualMachineScaleSet = 8,
    ExclusiveSupportingResource = 9,
}
