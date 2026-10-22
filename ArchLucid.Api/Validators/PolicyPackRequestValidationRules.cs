using System.Text.Json;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Shared predicates for policy pack HTTP request validation (SemVer labels, JSON shape, pack type whitelist).
/// </summary>
/// <remarks>
///     Consumed by <see cref="CreatePolicyPackRequestValidator" />,
///     <see cref="PublishPolicyPackVersionRequestValidator" />, and
///     <see cref="AssignPolicyPackRequestValidator" />. Keeps regex and JSON parsing in one place so API and tests stay
///     aligned.
/// </remarks>
public static class PolicyPackRequestValidationRules
{
    public const int PackVersionMaxLength = PolicyPackSemVerVersion.MaxLength;

    public const int PackNameMaxLength = 300;

    public const int PackDescriptionMaxLength = 20_000;

    public const string PackVersionSemVerMessage = PolicyPackSemVerVersion.SemVerMessage;

    /// <summary>Returns whether <paramref name="value" /> is non-null and not whitespace-only after trim.</summary>
    public static bool BeRequiredTextAfterTrim(string? value) => !string.IsNullOrWhiteSpace(value);

    /// <summary>Returns whether the trimmed <paramref name="value" /> length is at most <paramref name="maxLength" />.</summary>
    public static bool BeWithinTrimmedMaxLength(string? value, int maxLength) =>
        (value?.Trim().Length ?? 0) <= maxLength;

    /// <summary>Allowed <see cref="CreatePolicyPackRequest.PackType" /> values (case-insensitive set).</summary>
#pragma warning disable IDE0028 // Simplify collection initialization
    public static readonly HashSet<string> ValidPackTypes = new(StringComparer.OrdinalIgnoreCase)
#pragma warning restore IDE0028 // Simplify collection initialization
    {
        PolicyPackType.TenantCustom,
        PolicyPackType.WorkspaceCustom,
        PolicyPackType.ProjectCustom
    };

    /// <summary>
    ///     Returns whether <paramref name="value" /> matches the policy pack version pattern (trimmed).
    /// </summary>
    /// <param name="value">Raw version string from assign or publish body.</param>
    /// <returns><c>false</c> for null/whitespace; otherwise regex match result.</returns>
    /// <remarks>
    ///     Slightly stricter than full SemVer grammar in edge cases; aligned with integration tests and problem-detail
    ///     messages.
    /// </remarks>
    public static bool BePolicyPackSemVerVersion(string? value) =>
        PolicyPackSemVerVersion.TryParse(value, out _);

    /// <summary>
    ///     Returns <c>true</c> for null/whitespace, or for text that parses as a single JSON value/object/array.
    /// </summary>
    /// <param name="value">JSON string from create/publish bodies.</param>
    /// <remarks>Empty string is treated as valid (caller may normalize to <c>{}</c> downstream).</remarks>
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
}
