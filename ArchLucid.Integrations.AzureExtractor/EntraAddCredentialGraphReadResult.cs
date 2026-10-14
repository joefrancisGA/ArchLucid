using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class EntraAddCredentialGraphReadResult
{
    public bool Forbidden
    {
        get;
        init;
    }

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryApplicationOwnerRow> ApplicationOwners
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow> DirectoryRoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> ApplicationRegistrations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> GraphAppRoleAssignments
    {
        get;
        init;
    } = [];

    public static EntraAddCredentialGraphReadResult Empty() => new();

    public static EntraAddCredentialGraphReadResult ForbiddenResult(string warning) =>
        new()
        {
            Forbidden = true,
            Warnings = [warning],
        };
}
