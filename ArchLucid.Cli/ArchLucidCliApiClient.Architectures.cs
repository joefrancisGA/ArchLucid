using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

public sealed partial class ArchLucidApiClient
{
    public async Task<PagedResponse<ArchitectureIdentityListItem>?> ListArchitecturesAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        try
        {
            Gen.PagedResponseOfArchitectureIdentityListItem response =
                await _api.ArchitecturesGETAsync(page, pageSize, ct).ConfigureAwait(false);

            return DeserializeRoundTrip<PagedResponse<ArchitectureIdentityListItem>>(response);
        }
        catch (Exception ex)
        {
            LogCliFailure("ListArchitectures", ex);

            return null;
        }
    }

    public async Task<ArchitectureIdentityDetail?> GetArchitectureAsync(
        Guid architectureId,
        CancellationToken ct = default)
    {
        try
        {
            Gen.ArchitectureIdentityDetail response =
                await _api.ArchitecturesGET2Async(architectureId, ct).ConfigureAwait(false);

            return DeserializeRoundTrip<ArchitectureIdentityDetail>(response);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GetArchitecture({architectureId})", ex);

            return null;
        }
    }
}
