using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Unstructured architecture brief for LLM mapping into <see cref="ArchitectureRequest" />.
/// </summary>
public sealed class ChatIntakeRequest
{
    /// <summary>Raw pasted text (Slack thread, Jira ticket, markdown brief, etc.).</summary>
    [Required]
    [MinLength(20)]
    [MaxLength(50_000)]
    public string RawText
    {
        get;
        set;
    } = string.Empty;
}
