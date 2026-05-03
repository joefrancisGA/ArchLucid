using System.Text.Json.Serialization;

#pragma warning disable IDE0130
namespace ArchLucid.Api.Client.Generated;
#pragma warning restore IDE0130

public partial class ProblemDetails
{
    [JsonPropertyName("traceId")]
    public string? TraceId
    {
        get; set;
    }
}
