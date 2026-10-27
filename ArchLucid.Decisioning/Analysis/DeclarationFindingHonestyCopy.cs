namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Stable omission copy for declaration finding engines — never substitute graph node ids for missing labels.
/// </summary>
public static class DeclarationFindingHonestyCopy
{
    public const string ResourceNameNotStored = "Resource name was not stored.";

    public const string PropertyNameNotStored = "Property name was not stored.";

    public const string RequirementNameNotStored = "Requirement name was not stored.";

    public static string FormatResourceLabel(string? label) =>
        string.IsNullOrWhiteSpace(label) ? ResourceNameNotStored : label.Trim();

    public static string FormatPropertyName(string? propertyName) =>
        string.IsNullOrWhiteSpace(propertyName) ? PropertyNameNotStored : propertyName.Trim();

    public static string FormatRequirementLabel(string? label) =>
        string.IsNullOrWhiteSpace(label) ? RequirementNameNotStored : label.Trim();
}
