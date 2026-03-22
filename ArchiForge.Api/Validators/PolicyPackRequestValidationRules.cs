using System.Text.Json;
using ArchiForge.Decisioning.Governance.PolicyPacks;

namespace ArchiForge.Api.Validators;

public static class PolicyPackRequestValidationRules
{
    public static bool BeValidJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true;

        try
        {
            JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static readonly HashSet<string> ValidPackTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        PolicyPackType.BuiltIn,
        PolicyPackType.TenantCustom,
        PolicyPackType.WorkspaceCustom,
        PolicyPackType.ProjectCustom,
    };
}
