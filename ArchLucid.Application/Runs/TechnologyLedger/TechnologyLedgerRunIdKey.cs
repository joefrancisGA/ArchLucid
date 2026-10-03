namespace ArchLucid.Application.Runs.TechnologyLedger;

/// <summary>Canonical string run id used by <see cref="Persistence.Data.Repositories.TechnologyLedgerRepository"/> rows.</summary>
public static class TechnologyLedgerRunIdKey
{
    public static string Canonicalize(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return Guid.TryParse(runId, out Guid runKey) ? runKey.ToString("N") : runId.Trim();
    }

    public static string FromRunKey(Guid runKey) => runKey.ToString("N");
}
