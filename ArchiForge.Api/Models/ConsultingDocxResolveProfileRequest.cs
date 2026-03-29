namespace ArchiForge.Api.Models;

public sealed class ConsultingDocxResolveProfileRequest
{
    /// <summary>
    /// Requested template profile key (e.g. internal/client/regulated/executive). Optional; when null the selector may auto-select.
    /// </summary>
    public string? Profile { get; set; }

    /// <summary>
    /// Optional template name/variant (if supported by the profile selector).
    /// </summary>
    public string? TemplateName { get; set; }
}

