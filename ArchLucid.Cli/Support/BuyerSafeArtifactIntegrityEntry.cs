using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

public sealed class BuyerSafeArtifactIntegrityEntry
{
    [JsonPropertyName("fileName")]
    public string FileName
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("byteCount")]
    public long ByteCount
    {
        get;
        init;
    }

    [JsonPropertyName("sha256Hex")]
    public string Sha256Hex
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("redactionStatus")]
    public string RedactionStatus
    {
        get;
        init;
    } = string.Empty;
}
