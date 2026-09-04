using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Body validation for <c>POST /v1/policy-packs/validate</c> before tenant preflight.</summary>
public static class PolicyPackValidateContentHttpMapper
{
    public static GovernanceHttpValidation? Validate(JsonElement body)
    {
        if (body.ValueKind is not JsonValueKind.Object)
            return new GovernanceHttpValidation("Expected a JSON object.", ProblemTypes.ValidationFailed);

        PolicyPackContentDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                body.GetRawText(),
                ContractJson.CamelCaseIgnoreNullCompact);
        }
        catch (JsonException jsonException)
        {
            return new GovernanceHttpValidation(
                $"Invalid JSON: {jsonException.Message}",
                ProblemTypes.ValidationFailed);
        }

        if (document is null)
        {
            return new GovernanceHttpValidation(
                "Deserialized document is null.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
