using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Builds outbound HTTP Authorization headers for ITSM vendor calls (TB-600).</summary>
public static class ItsmOutboundHttpAuthorizationHeaders
{
    public static AuthenticationHeaderValue CreateBasic(string userName, string secretValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userName);
        ArgumentException.ThrowIfNullOrWhiteSpace(secretValue);

        string basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{userName.Trim()}:{secretValue.Trim()}"));

        return new AuthenticationHeaderValue("Basic", basic);
    }

    /// <summary>Azure DevOps PAT auth uses an empty username and the PAT as the password.</summary>
    public static AuthenticationHeaderValue CreatePat(string personalAccessToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(personalAccessToken);

        string basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($":{personalAccessToken.Trim()}"));

        return new AuthenticationHeaderValue("Basic", basic);
    }

    public static AuthenticationHeaderValue CreateBearer(string accessToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

        return new AuthenticationHeaderValue("Bearer", accessToken.Trim());
    }

    public static void Apply(HttpRequestMessage request, AuthenticationHeaderValue authorization)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(authorization);

        request.Headers.Authorization = authorization;
    }
}
