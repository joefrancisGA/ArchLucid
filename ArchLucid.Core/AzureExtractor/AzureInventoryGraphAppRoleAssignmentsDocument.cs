namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryGraphAppRoleAssignmentsDocument
{
    public IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> Registrations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> AppRoleAssignments
    {
        get;
        init;
    } = [];
}
