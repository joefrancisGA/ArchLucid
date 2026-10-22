namespace ArchLucid.Contracts.Roi;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>Supported export formats for the sponsor ROI board pack.</summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<SponsorRoiBoardPackFormat>))]
public enum SponsorRoiBoardPackFormat
{
    Markdown,
    Pdf
}
