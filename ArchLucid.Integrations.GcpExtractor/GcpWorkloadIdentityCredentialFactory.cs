using Google.Apis.Auth.OAuth2;

namespace ArchLucid.Integrations.GcpExtractor;

public sealed class GcpWorkloadIdentityCredentialFactory(
    IGcpSubjectTokenProvider subjectTokenProvider)
{
    private readonly IGcpSubjectTokenProvider _subjectTokenProvider =
        subjectTokenProvider ?? throw new ArgumentNullException(nameof(subjectTokenProvider));

    public GoogleCredential CreateImpersonatedCredential(
        string workloadIdentityPoolProvider,
        string serviceAccountEmail)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workloadIdentityPoolProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceAccountEmail);

        string audience = NormalizeAudience(workloadIdentityPoolProvider.Trim());
        string normalizedServiceAccountEmail = serviceAccountEmail.Trim();

        ProgrammaticExternalAccountCredential.Initializer initializer = new(
            "https://sts.googleapis.com/v1/token",
            audience,
            "urn:ietf:params:oauth:token-type:jwt",
            new AzureAdSubjectTokenSupplier(_subjectTokenProvider))
        {
            ServiceAccountImpersonationUrl =
                $"https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{normalizedServiceAccountEmail}:generateAccessToken"
        };

        ProgrammaticExternalAccountCredential externalCredential = new(initializer);

        return externalCredential.ToGoogleCredential();
    }

    internal static string NormalizeAudience(string workloadIdentityPoolProvider)
    {
        const string audiencePrefix = "//iam.googleapis.com/";
        const string httpsAudiencePrefix = "https://iam.googleapis.com/";

        if (workloadIdentityPoolProvider.StartsWith(audiencePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return audiencePrefix + workloadIdentityPoolProvider.Substring(audiencePrefix.Length);
        }

        if (workloadIdentityPoolProvider.StartsWith(httpsAudiencePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return audiencePrefix + workloadIdentityPoolProvider.Substring(httpsAudiencePrefix.Length);
        }

        return $"{audiencePrefix}{workloadIdentityPoolProvider.TrimStart('/')}";
    }

    private sealed class AzureAdSubjectTokenSupplier(IGcpSubjectTokenProvider provider)
        : ProgrammaticExternalAccountCredential.ISubjectTokenProvider
    {
        private readonly IGcpSubjectTokenProvider _provider =
            provider ?? throw new ArgumentNullException(nameof(provider));

        public Task<string> GetSubjectTokenAsync(
            ProgrammaticExternalAccountCredential caller,
            CancellationToken cancellationToken) =>
            _provider.GetSubjectTokenAsync(cancellationToken);
    }
}
