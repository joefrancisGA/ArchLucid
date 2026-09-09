namespace ArchLucid.Application.Planning.AdvisoryDraft;

/// <summary>Outcome of registering an advisory draft async operation (DR-14 idempotent create).</summary>
public sealed record AdvisoryDraftOperationCreateResult(
    AdvisoryDraftOperationRecord Record,
    bool Created);
