namespace ArchLucid.Contracts.Architecture;

/// <summary>Partial update for a customer-visible architecture identity (ADR 0074 / CA-10).</summary>
public sealed class PatchArchitectureIdentityRequest
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

    public bool HasDisplayName => DisplayName is not null;

    public bool HasDescription => Description is not null;

    public bool HasAnyPatch => HasDisplayName || HasDescription;
}
