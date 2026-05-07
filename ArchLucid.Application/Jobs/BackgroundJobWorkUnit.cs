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
public sealed record AnalysisReportDocxWorkUnit(AnalysisReportDocxJobPayload Payload, string FileName, string ContentType) : BackgroundJobWorkUnit
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Payload, FileName, ContentType);
    private static byte __ValidatePrimaryConstructorArguments(ArchLucid.Application.Jobs.AnalysisReportDocxJobPayload payload, System.String fileName, System.String contentType)
    {
        ArgumentNullException.ThrowIfNull(payload);
        ArgumentNullException.ThrowIfNull(fileName);
        ArgumentNullException.ThrowIfNull(contentType);
        return (byte)0;
    }
}

/// <summary>Consulting-style analysis report exported as DOCX.</summary>
public sealed record ConsultingDocxWorkUnit(ConsultingDocxJobPayload Payload, string FileName, string ContentType) : BackgroundJobWorkUnit
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Payload, FileName, ContentType);
    private static byte __ValidatePrimaryConstructorArguments(ArchLucid.Application.Jobs.ConsultingDocxJobPayload payload, System.String fileName, System.String contentType)
    {
        ArgumentNullException.ThrowIfNull(payload);
        ArgumentNullException.ThrowIfNull(fileName);
        ArgumentNullException.ThrowIfNull(contentType);
        return (byte)0;
    }
}