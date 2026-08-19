namespace ArchLucid.Integrations.GcpExtractor;

public interface IGcpSubjectTokenProvider
{
    Task<string> GetSubjectTokenAsync(CancellationToken cancellationToken);
}
