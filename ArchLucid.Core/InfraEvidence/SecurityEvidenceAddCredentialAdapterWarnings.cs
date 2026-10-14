namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidenceAddCredentialAdapterWarnings
{
    public const string MissingApplicationOwners =
        "application-owners.json missing: privilege paths cannot traverse application ownership";

    public const string MissingDirectoryRoleAssignments =
        "directory-role-assignments.json missing: privilege paths cannot traverse directory credential roles";

    public const string MissingGraphAppRoleAssignments =
        "graph-app-role-assignments.json missing: privilege paths cannot traverse Application.ReadWrite.All";
}
