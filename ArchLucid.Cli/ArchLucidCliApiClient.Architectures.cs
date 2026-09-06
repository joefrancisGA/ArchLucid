using ArchLucid.Contracts.Architecture;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

public sealed partial class ArchLucidApiClient
{
    public async Task<ArchitectureIdentityListPage?> ListArchitecturesAsync(
        int page,
        int pageSize,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        try
        {
            Gen.ArchitectureIdentityListPage response =
                await _api.ArchitecturesGETAsync(page, pageSize, includeArchived, ct).ConfigureAwait(false);

            return MapGeneratedToContract<ArchitectureIdentityListPage>(response);
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
