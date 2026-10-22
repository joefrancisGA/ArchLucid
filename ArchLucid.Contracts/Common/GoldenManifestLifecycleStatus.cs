namespace ArchLucid.Contracts.Common;

/// <summary>Post-commit lifecycle of a persisted golden manifest row.</summary>
public enum GoldenManifestLifecycleStatus
{
    /// <summary>Current committed manifest for its run (not soft-deleted).</summary>
    Active = 1,

    /// <summary>Superseded by operational policy (e.g. newer promotion in the same scope).</summary>
    Superseded = 2,

    /// <summary>Soft-archived via <c>ArchivedUtc</c>.</summary>
    Archived = 3
}
