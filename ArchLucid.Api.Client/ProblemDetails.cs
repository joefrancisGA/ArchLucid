using System.Text.Json.Serialization;

namespace ArchLucid.Api.Client.Generated;

public partial class ProblemDetails
{
    [JsonPropertyName("traceId")]
    public string? TraceId { get; set; }
}
