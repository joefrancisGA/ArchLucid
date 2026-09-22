namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidenceEntraGroupAdapterWarnings
{
    public const string MissingFile =
        "entra-group-memberships.json missing: privilege paths cannot traverse group membership";

    public const string GraphForbidden =
        "entra group membership Graph read forbidden (403): privilege paths cannot traverse group membership";

    public const string GraphDisabled =
        "entra group membership Graph adapter disabled: supply entra-group-memberships.json or enable EntraGroupMembershipGraph";
}
