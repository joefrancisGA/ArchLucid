namespace ArchLucid.Integrations.AwsExtractor;

public interface IAwsOidcWebIdentityTokenProvider
{
    Task<string> GetWebIdentityTokenAsync(CancellationToken cancellationToken);
}
