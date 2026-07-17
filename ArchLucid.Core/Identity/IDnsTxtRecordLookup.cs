namespace ArchLucid.Core.Identity;

/// <summary>Resolves TXT records for domain ownership verification.</summary>
public interface IDnsTxtRecordLookup
{
    Task<IReadOnlyList<string>> GetTxtRecordsAsync(string domain, CancellationToken cancellationToken);
}
