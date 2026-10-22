using ArchLucid.Contracts.Notifications;

namespace ArchLucid.Application.ExecDigest;

/// <summary>Loads tokenized read-only sponsor digest views for anonymous email deep links (TB-2196).</summary>
public interface IExecDigestSponsorDeepLinkReadService
{
    Task<ExecDigestSponsorDeepLinkViewResponse?> TryLoadViewAsync(
        string token,
        string? expectedRunIdHex,
        CancellationToken cancellationToken);
}
