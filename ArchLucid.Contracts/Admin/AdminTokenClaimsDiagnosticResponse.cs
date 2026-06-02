namespace ArchLucid.Contracts.Admin;

/// <summary>Result of piping a JWT through ArchLucid role-claim normalization (signature not validated).</summary>
public sealed class AdminTokenClaimsDiagnosticResponse
{
    public IReadOnlyList<string> ResolvedRoles
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> UnmappedValues
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];
}
