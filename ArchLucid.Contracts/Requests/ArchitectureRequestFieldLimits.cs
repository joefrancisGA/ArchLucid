namespace ArchLucid.Contracts.Requests;

/// <summary>Shared length bounds for <see cref="ArchitectureRequest" /> narrative fields.</summary>
public static class ArchitectureRequestFieldLimits
{
    /// <summary>Minimum characters for <see cref="ArchitectureRequest.Description" />.</summary>
    public const int MinDescriptionLength = 10;

    /// <summary>Maximum characters for <see cref="ArchitectureRequest.Description" /> and persisted run descriptions.</summary>
    public const int MaxDescriptionLength = 10_000;

    /// <summary>Maximum characters for each <see cref="ArchitectureRequest.InlineRequirements" /> item.</summary>
    public const int MaxInlineRequirementLength = 10_000;
}
