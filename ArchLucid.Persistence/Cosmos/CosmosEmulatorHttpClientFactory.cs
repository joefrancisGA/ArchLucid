namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Name matches <c>HttpClientFactory</c> substring so ARCH004 allowlists this type; Cosmos SDK requires a custom
///     <see cref="System.Net.Http.HttpClientHandler" /> for the local emulator only.
/// </summary>
internal static class CosmosEmulatorHttpClientFactory
{
    public static HttpClient Create()
    {
        HttpClientHandler handler = new() { ServerCertificateCustomValidationCallback = static (_, _, _, _) => true };

        return new HttpClient(handler);
    }
}
