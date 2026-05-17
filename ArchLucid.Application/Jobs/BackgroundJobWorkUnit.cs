using System.Text.Json.Serialization;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Polymorphic work description for durable background export jobs (serialized to SQL and executed on the worker).
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "discriminator")]
[JsonDerivedType(typeof(AnalysisReportDocxWorkUnit), "analysisReportDocx")]
[JsonDerivedType(typeof(ConsultingDocxWorkUnit), "consultingDocx")]
[JsonDerivedType(typeof(TenantDeletionWorkUnit), "tenantDeletion")]
public abstract record BackgroundJobWorkUnit;

/// <summary>Standard analysis report exported as DOCX.</summary>
[method: JsonConstructor]
public sealed record AnalysisReportDocxWorkUnit(AnalysisReportDocxJobPayload Payload, string FileName, string ContentType) : BackgroundJobWorkUnit
{
    public AnalysisReportDocxJobPayload Payload
    {
        get;
        init;
    } = Payload ?? throw new ArgumentNullException(nameof(Payload));

    public string FileName
    {
        get;
        init;
    } = FileName ?? throw new ArgumentNullException(nameof(FileName));

    public string ContentType
    {
        get;
        init;
    } = ContentType ?? throw new ArgumentNullException(nameof(ContentType));
}

/// <summary>Consulting-style analysis report exported as DOCX.</summary>
[method: JsonConstructor]
public sealed record ConsultingDocxWorkUnit(ConsultingDocxJobPayload Payload, string FileName, string ContentType) : BackgroundJobWorkUnit
{
    public ConsultingDocxJobPayload Payload
    {
        get;
        init;
    } = Payload ?? throw new ArgumentNullException(nameof(Payload));

    public string FileName
    {
        get;
        init;
    } = FileName ?? throw new ArgumentNullException(nameof(FileName));

    public string ContentType
    {
        get;
        init;
    } = ContentType ?? throw new ArgumentNullException(nameof(ContentType));
}
