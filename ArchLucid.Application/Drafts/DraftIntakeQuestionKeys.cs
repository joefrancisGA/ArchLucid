namespace ArchLucid.Application.Drafts;

/// <summary>
///     Stable question keys for Socratic draft intake (ADR 0051). Shared between question selection,
///     projection into <see cref="ArchLucid.Contracts.Requests.ArchitectureRequest" />, and UI rendering.
/// </summary>
public static class DraftIntakeQuestionKeys
{
    /// <summary>
    ///     L0 MUST question for target cloud posture. Answers must be exact
    ///     <see cref="ArchLucid.Contracts.Common.CloudProvider" /> member names.
    /// </summary>
    public const string CloudTarget = "l0.pillar.cloud-target";
}
