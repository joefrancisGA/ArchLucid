using System.Text.Json.Serialization;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Polymorphic work description for durable background export jobs (serialized to SQL and executed on the worker).
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "discriminator")]
[JsonDerivedType(typeof(AnalysisReportDocxWorkUnit), "analysisReportDocx")]
[JsonDerivedType(typeof(ConsultingDocxWorkUnit), "consultingDocx")]
public abstract record BackgroundJobWorkUnit;

/// <summary>Standard analysis report exported as DOCX.</summary>
public sealed record AnalysisReportDocxWorkUnit : BackgroundJobWorkUnit
{
    public AnalysisReportDocxJobPayload Payload
    {
        get;
        init;
    }

    public string FileName
    {
        get;
        init;
    }

    public string ContentType
    {
        get;
        init;
    }

    [JsonConstructor]
    public AnalysisReportDocxWorkUnit(AnalysisReportDocxJobPayload payload, string fileName, string contentType)
    {
        Payload = payload ?? throw new ArgumentNullException(nameof(payload));
        FileName = fileName ?? throw new ArgumentNullException(nameof(fileName));
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
    }
}

/// <summary>Consulting-style analysis report exported as DOCX.</summary>
public sealed record ConsultingDocxWorkUnit : BackgroundJobWorkUnit
{
    public ConsultingDocxJobPayload Payload
    {
        get;
        init;
    }

    public string FileName
    {
        get;
        init;
    }

    public string ContentType
    {
        get;
        init;
    }

    [JsonConstructor]
    public ConsultingDocxWorkUnit(ConsultingDocxJobPayload payload, string fileName, string contentType)
    {
        Payload = payload ?? throw new ArgumentNullException(nameof(payload));
        FileName = fileName ?? throw new ArgumentNullException(nameof(fileName));
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
    }
}
