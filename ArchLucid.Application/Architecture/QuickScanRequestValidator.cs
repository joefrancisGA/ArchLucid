using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Architecture;

/// <summary>Server-side validation for Quick Scan requests.</summary>
public static class QuickScanRequestValidator
{
    public sealed record ValidatedQuickScanRequest(
        string SystemName,
        string PrimaryEnvironment,
        string? PrimaryEnvironmentOther,
        string Description,
        IReadOnlyList<string> ArchitectureConcerns);

    public static bool TryValidate(
        ArchitectureQuickScanRequest? request,
        QuickScanOptions options,
        out ValidatedQuickScanRequest? validated,
        out string? errorMessage)
    {
        validated = null;
        errorMessage = null;

        if (request is null)
        {
            errorMessage = "Request body is required.";
            return false;
        }

        string systemName = (request.SystemName ?? string.Empty).Trim();

        if (systemName.Length == 0)
        {
            errorMessage = "systemName is required.";
            return false;
        }

        if (systemName.Length > options.MaxSystemNameLength)
        {
            errorMessage = $"systemName must be {options.MaxSystemNameLength} characters or fewer.";
            return false;
        }

        string environmentRaw = (request.PrimaryEnvironment ?? string.Empty).Trim();

        if (environmentRaw.Length == 0 && !string.IsNullOrWhiteSpace(request.CloudProvider))
            environmentRaw = request.CloudProvider.Trim();

        if (!QuickScanPrimaryEnvironment.TryNormalize(environmentRaw, out string primaryEnvironment))
        {
            errorMessage = "primaryEnvironment must be a supported value.";
            return false;
        }

        string? environmentOther = string.IsNullOrWhiteSpace(request.PrimaryEnvironmentOther)
            ? null
            : request.PrimaryEnvironmentOther.Trim();

        if (environmentOther is { Length: > 80 })
        {
            errorMessage = "primaryEnvironmentOther must be 80 characters or fewer.";
            return false;
        }

        string description = (request.Description ?? string.Empty).Trim();

        if (description.Length == 0)
        {
            errorMessage = "description is required.";
            return false;
        }

        if (description.Length > options.MaxDescriptionLength)
        {
            errorMessage = $"description must be {options.MaxDescriptionLength} characters or fewer.";
            return false;
        }

        List<string> concerns = [];

        foreach (string rawConcern in request.ArchitectureConcerns ?? [])
        {
            if (!QuickScanArchitectureConcern.TryNormalize(rawConcern, out string normalized))
            {
                errorMessage = "architectureConcerns contains an unsupported value.";
                return false;
            }

            if (concerns.Any(existing => string.Equals(existing, normalized, StringComparison.OrdinalIgnoreCase)))
                continue;

            concerns.Add(normalized);
        }

        if (concerns.Count > options.MaxArchitectureConcerns)
        {
            errorMessage = $"Select at most {options.MaxArchitectureConcerns} architecture concerns.";
            return false;
        }

        validated = new ValidatedQuickScanRequest(
            systemName,
            primaryEnvironment,
            environmentOther,
            description,
            concerns);

        return true;
    }
}
