using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Admin;

/// <summary>Result of piping a JWT through ArchLucid role-claim normalization (signature not validated).</summary>
public sealed class AdminTokenClaimsDiagnosticResponse
{
    private IReadOnlyList<string> resolvedRoles = [];

    public IReadOnlyList<string> ResolvedRoles
    {
        get => resolvedRoles;
        init => resolvedRoles = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> unmappedValues = [];

    public IReadOnlyList<string> UnmappedValues
    {
        get => unmappedValues;
        init => unmappedValues = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> warnings = [];

    public IReadOnlyList<string> Warnings
    {
        get => warnings;
        init => warnings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
