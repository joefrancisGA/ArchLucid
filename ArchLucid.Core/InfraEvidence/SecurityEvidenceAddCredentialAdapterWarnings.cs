namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidenceAddCredentialAdapterWarnings
{
    public const string MissingApplicationOwners =
        "application-owners.json missing: privilege paths cannot traverse application ownership";

    public const string MissingDirectoryRoleAssignments =
        "directory-role-assignments.json missing: privilege paths cannot traverse directory credential roles";

    public const string MissingGraphAppRoleAssignments =
        "graph-app-role-assignments.json missing: privilege paths cannot traverse Application.ReadWrite.All";

    public const string GraphForbidden =
        "Entra add-credential Graph read returned 403; grant Application.Read.All, Directory.Read.All, and AppRoleAssignment.Read.All";
}
