using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AdvisoryTerraformResourceMappingRecord
{
    public Guid MappingId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string TerraformAddress
    {
        get;
        init;
    } = string.Empty;

    public string CategoryFolder
    {
        get;
        init;
    } = string.Empty;

    public AdvisoryTerraformGenerationMethod GenerationMethod
    {
        get;
        init;
    }

    public string? UncertaintyNotes
    {
        get;
        init;
    }
}
