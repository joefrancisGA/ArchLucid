using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Loads per-pack compliance rule keys from published pack version <c>ContentJson</c>.
/// </summary>
internal static class PolicyPackAssignmentComplianceRuleKeysResolver
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static async Task<List<string>> ResolveForAssignmentAsync(
        IPolicyPackVersionRepository versionRepository,
        PolicyPackAssignment assignment,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(versionRepository);
        ArgumentNullException.ThrowIfNull(assignment);

        if (string.IsNullOrWhiteSpace(assignment.PolicyPackVersion))
            return [];

        PolicyPackVersion? versionRow = await versionRepository
            .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, cancellationToken)
            .ConfigureAwait(false);

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return [];

        try
        {
            PolicyPackContentDocument? content = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                versionRow.ContentJson,
                JsonOptions);

            return NormalizeKeys(content?.ComplianceRuleKeys);
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static List<string> NormalizeKeys(IReadOnlyList<string>? keys)
    {
        if (keys is not { Count: > 0 })
            return [];

        return keys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(key => key, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
