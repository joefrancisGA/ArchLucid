namespace ArchLucid.Core.Support;

public interface ISupportProblemReportRepository
{
    Task<SupportProblemReportRecord> InsertAsync(
        SupportProblemReportInsert insert,
        CancellationToken cancellationToken);

    Task<SupportProblemReportRecord?> GetByIdAsync(
        Guid tenantId,
        Guid reportId,
        CancellationToken cancellationToken);

    Task<SupportProblemReportRecord?> UpdateSupportBundleBlobPathAsync(
        Guid tenantId,
        Guid reportId,
        string supportBundleBlobPath,
        CancellationToken cancellationToken);
}

public sealed class SupportProblemReportInsert
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid? ProjectId
    {
        get;
        init;
    }

    public string SubmittedByActorId
    {
        get;
        init;
    } = string.Empty;

    public string ContextJson
    {
        get;
        init;
    } = string.Empty;

    public string? OperatorNote
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? ClientRequestId
    {
        get;
        init;
    }

    public string? SupportBundleBlobPath
    {
        get;
        init;
    }
}
