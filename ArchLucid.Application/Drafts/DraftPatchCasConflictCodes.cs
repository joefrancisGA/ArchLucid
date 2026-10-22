namespace ArchLucid.Application.Drafts;

/// <summary>Stable ProblemDetails codes for draft PATCH compare-and-swap (ADR 0088 / LW-014).</summary>
public static class DraftPatchCasConflictCodes
{
    public const string TokenMissing = "draft_cas_token_missing";

    public const string Stale = "draft_cas_stale";
}
