namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Validates tenant pack snapshots before upsert into the global catalog.</summary>
public static class PolicyPackCatalogPromotionValidation
{
    public static void ValidateSnapshotOrThrow(string displayName, string? description)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException(
                "Policy pack name is required for catalog promotion.",
                nameof(displayName));
        }

        string trimmedName = displayName.Trim();

        if (trimmedName.Length > PolicyPackCatalogEntryLimits.DisplayNameMaxLength)
        {
            throw new ArgumentException(
                $"Policy pack name must be at most {PolicyPackCatalogEntryLimits.DisplayNameMaxLength} characters for catalog promotion.",
                nameof(displayName));
        }

        string trimmedDescription = (description ?? string.Empty).Trim();

        if (trimmedDescription.Length > PolicyPackCatalogEntryLimits.DescriptionMaxLength)
        {
            throw new ArgumentException(
                $"Policy pack description must be at most {PolicyPackCatalogEntryLimits.DescriptionMaxLength} characters for catalog promotion.",
                nameof(description));
        }
    }
}
