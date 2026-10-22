using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Explanation;

/// <summary>Optional focus for an unstructured holistic architecture critique (preview only).</summary>
public sealed class HolisticCriticRequest
{
    [MaxLength(500)]
    public string? Focus
    {
        get;
        set;
    }
}
