namespace ArchLucid.Api.Tests;

/// <summary>Canonical GET helpers for <c>/v1/pilots/*</c> demo and marketing snapshots.</summary>
public static class PilotsHarnessExtensions
{
    public static Task<HttpResponseMessage> GetWhyArchLucidSnapshotHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/why-archlucid-snapshot", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetSponsorEvidencePackHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/sponsor-evidence-pack", cancellationToken);
    }
}
