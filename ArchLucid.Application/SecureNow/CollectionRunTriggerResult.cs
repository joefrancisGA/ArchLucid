using ArchLucid.Core.SecureNow;

namespace ArchLucid.Application.SecureNow;

public sealed record CollectionRunTriggerResult(
    bool Succeeded,
    Guid? RunId,
    string? FailureDetail,
    bool AlreadyPending)
{
    public static CollectionRunTriggerResult Pending(CollectionRun run) =>
        new(true, run.RunId, null, false);

    public static CollectionRunTriggerResult Duplicate(CollectionRun run) =>
        new(true, run.RunId, null, true);

    public static CollectionRunTriggerResult Failed(string detail) =>
        new(false, null, detail, false);
}
