namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidenceAddCredentialAdapterWarnings
{
    public const string MissingApplicationOwners =
        "application-owners.json missing: privilege paths cannot traverse application ownership";

    public const string MissingDirectoryRoleAssignments =
        "directory-role-assignments.json missing: privilege paths cannot traverse directory credential roles";

    public const string MissingGraphAppRoleAssignments =
        "graph-app-role-assignments.json missing: privilege paths cannot traverse Application.ReadWrite.All";

    // Written by the materializer only when the known capture downgrade is Entra-specific.
    public const string EntraOnlyCapturePartial = "capture-partial-entra-only";

    public static bool IsEntraEvidenceWarning(string warning) =>
        string.Equals(warning, GraphIncomplete, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, GraphForbidden, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, GraphNotCollected, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, MissingApplicationOwners, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, MissingDirectoryRoleAssignments, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, MissingGraphAppRoleAssignments, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, SecurityEvidenceEntraGroupAdapterWarnings.GraphIncomplete, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, SecurityEvidenceEntraGroupAdapterWarnings.GraphForbidden, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, SecurityEvidenceEntraGroupAdapterWarnings.GraphDisabled, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, SecurityEvidenceEntraGroupAdapterWarnings.MissingFile, StringComparison.OrdinalIgnoreCase)
        || string.Equals(warning, SecurityEvidenceFederatedCredentialAdapterWarnings.MissingFile, StringComparison.OrdinalIgnoreCase);

    public const string GraphIncomplete = "entra-add-credential-graph-incomplete";
    public const string GraphNotCollected = "entra-add-credential-graph-not-collected";

    public const string GraphForbidden =
        "Entra add-credential Graph read returned 403; grant Application.Read.All, Directory.Read.All, and AppRoleAssignment.Read.All";
}
