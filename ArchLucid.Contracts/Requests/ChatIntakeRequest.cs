using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Unstructured architecture brief for LLM mapping into <see cref="ArchitectureRequest" />.
/// </summary>
public sealed class ChatIntakeRequest
{
    /// <summary>Raw pasted text (Slack thread, Jira ticket, markdown brief, etc.).</summary>
    [Required]
    [MinLength(20)]
    [MaxLength(DraftIntakeValidation.MaximumFreeTextIntentLength)]
    public string RawText
    {
        get;
        set;
    } = string.Empty;
}
