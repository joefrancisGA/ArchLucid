namespace ArchLucid.Contracts.Architecture;

/// <summary>PATCH body for renaming a customer-visible architecture identity.</summary>
public sealed class ArchitectureIdentityPatchRequest
{
    public string? DisplayName
    {
        get;
        set;
    }

    public string? Description
    {
        get;
        set;
    }
}
