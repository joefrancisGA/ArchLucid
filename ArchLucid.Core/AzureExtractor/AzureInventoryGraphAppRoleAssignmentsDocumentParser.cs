using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Parses graph-app-role-assignments.json, which may contain app registrations and Graph app role rows.</summary>
public static class AzureInventoryGraphAppRoleAssignmentsDocumentParser
{
    public static AzureInventoryGraphAppRoleAssignmentsDocument Parse(JsonElement root)
    {
        List<AzureInventoryEntraApplicationRegistrationRow> registrations = [];
        List<AzureInventoryGraphAppRoleAssignmentRow> assignments = [];

        if (root.ValueKind is not JsonValueKind.Array)
        {
            return new AzureInventoryGraphAppRoleAssignmentsDocument
            {
                Registrations = registrations,
                AppRoleAssignments = assignments,
            };
        }

        foreach (JsonElement element in root.EnumerateArray())
        {
            if (AzureInventoryEntraApplicationRegistrationParser.TryParse(element, out AzureInventoryEntraApplicationRegistrationRow? registration, out _)
                && registration is not null)
            {
                registrations.Add(registration);
                continue;
            }

            if (AzureInventoryGraphAppRoleAssignmentParser.TryParse(element, out AzureInventoryGraphAppRoleAssignmentRow? assignment, out _)
                && assignment is not null)
            {
                assignments.Add(assignment);
            }
        }

        return new AzureInventoryGraphAppRoleAssignmentsDocument
        {
            Registrations = registrations,
            AppRoleAssignments = assignments,
        };
    }
}
