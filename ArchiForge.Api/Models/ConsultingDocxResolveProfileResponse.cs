namespace ArchiForge.Api.Models;

public sealed class ConsultingDocxResolveProfileResponse
{
    public string? RequestedProfile
    {
        get; set;
    }

    public string? RequestedTemplateName
    {
        get; set;
    }

    public string ResolvedProfile { get; set; } = string.Empty;

    public string ResolvedProfileDisplayName { get; set; } = string.Empty;

    public bool WasAutoSelected
    {
        get; set;
    }

    public string? ResolutionReason
    {
        get; set;
    }
}

