namespace ArchLucid.Application.Evidence;

/// <summary>Honest prose for markdown evidence summaries — blank fields must not read as stored facts.</summary>
public static class MarkdownEvidenceSummaryExportHonesty
{
    public const string SystemNameNotStored = "System name was not stored.";
    public const string EnvironmentNotStored = "Environment was not stored.";
    public const string CloudProviderNotStored = "Cloud provider was not stored.";
    public const string DescriptionNotStored = "Description was not stored.";
    public const string PolicyTitleNotStored = "Policy title was not stored.";
    public const string PolicyIdNotStored = "Policy id was not stored.";
    public const string PolicySummaryNotStored = "Policy summary was not stored.";
    public const string RequiredControlsNotStored = "Required controls were not stored.";
    public const string TagsNotStored = "Tags were not stored.";
    public const string ServiceNameNotStored = "Service name was not stored.";
    public const string ServiceCategoryNotStored = "Service category was not stored.";
    public const string ServiceSummaryNotStored = "Service summary was not stored.";
    public const string RecommendedUseCasesNotStored = "Recommended use cases were not stored.";
    public const string PatternNameNotStored = "Pattern name was not stored.";
    public const string PatternIdNotStored = "Pattern id was not stored.";
    public const string PatternSummaryNotStored = "Pattern summary was not stored.";
    public const string ApplicableCapabilitiesNotStored = "Applicable capabilities were not stored.";
    public const string SuggestedServicesNotStored = "Suggested services were not stored.";
    public const string ManifestVersionNotStored = "Manifest version was not stored.";
    public const string PriorManifestSummaryNotStored = "Prior manifest summary was not stored.";
    public const string ExistingServicesNotStored = "Existing services were not stored.";
    public const string ExistingDatastoresNotStored = "Existing datastores were not stored.";
    public const string ExistingRequiredControlsNotStored = "Existing required controls were not stored.";
    public const string NoteTypeNotStored = "Note type was not stored.";
    public const string NoteMessageNotStored = "Note message was not stored.";

    public static string FormatInline(string? value, string notStoredLabel) =>
        string.IsNullOrWhiteSpace(value) ? notStoredLabel : value.Trim();
}
