namespace ArchiForge.Application.Analysis;

public sealed class ResolvedConsultingDocxExportProfile
{
    public string SelectedProfileName { get; set; } = string.Empty;

    public string SelectedProfileDisplayName { get; set; } = string.Empty;

    public bool WasAutoSelected
    {
        get; set;
    }

    public string ResolutionReason { get; set; } = string.Empty;
}

