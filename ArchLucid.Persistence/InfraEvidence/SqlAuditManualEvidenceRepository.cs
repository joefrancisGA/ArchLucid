using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditManualEvidenceRepository(ISqlConnectionFactory connectionFactory)
    : IAuditManualEvidenceRepository
{
    public async Task InsertSubmissionAsync(
        AuditManualEvidenceSubmissionRecord submission,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(submission);

        const string sql = """
                           INSERT INTO dbo.AuditManualEvidenceSubmissions
                           (
                               SubmissionId, TenantId, AssessmentId, ControlId, RequirementId,
                               Owner, SubmittedBy, SubmittedUtc, ApplicablePeriodStartUtc, ApplicablePeriodEndUtc,
                               ExpirationUtc, DocumentVersion, DocumentKind, EvidenceHashSha256, BlobPointer,
                               ReviewStatus, ProvenanceKind, ItsmProvider, ItsmExternalKey
                           )
                           VALUES
                           (
                               @SubmissionId, @TenantId, @AssessmentId, @ControlId, @RequirementId,
                               @Owner, @SubmittedBy, @SubmittedUtc, @ApplicablePeriodStartUtc, @ApplicablePeriodEndUtc,
                               @ExpirationUtc, @DocumentVersion, @DocumentKind, @EvidenceHashSha256, @BlobPointer,
                               @ReviewStatus, @ProvenanceKind, @ItsmProvider, @ItsmExternalKey
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    submission.SubmissionId,
                    submission.TenantId,
                    submission.AssessmentId,
                    submission.ControlId,
                    submission.RequirementId,
                    submission.Owner,
                    submission.SubmittedBy,
                    submission.SubmittedUtc,
                    submission.ApplicablePeriodStartUtc,
                    submission.ApplicablePeriodEndUtc,
                    submission.ExpirationUtc,
                    submission.DocumentVersion,
                    submission.DocumentKind,
                    submission.EvidenceHashSha256,
                    submission.BlobPointer,
                    ReviewStatus = (int)submission.ReviewStatus,
                    ProvenanceKind = (int)submission.ProvenanceKind,
                    submission.ItsmProvider,
                    submission.ItsmExternalKey,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT SubmissionId, TenantId, AssessmentId, ControlId, RequirementId,
                                  Owner, SubmittedBy, SubmittedUtc, ApplicablePeriodStartUtc, ApplicablePeriodEndUtc,
                                  ExpirationUtc, DocumentVersion, DocumentKind, EvidenceHashSha256, BlobPointer,
                                  ReviewStatus, ProvenanceKind, ItsmProvider, ItsmExternalKey
                           FROM dbo.AuditManualEvidenceSubmissions
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId
                           ORDER BY SubmittedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<SubmissionRow> rows = await conn.QueryAsync<SubmissionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId },
                cancellationToken: cancellationToken));

        return rows.Select(MapSubmission).ToList();
    }

    public async Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT SubmissionId, TenantId, AssessmentId, ControlId, RequirementId,
                                  Owner, SubmittedBy, SubmittedUtc, ApplicablePeriodStartUtc, ApplicablePeriodEndUtc,
                                  ExpirationUtc, DocumentVersion, DocumentKind, EvidenceHashSha256, BlobPointer,
                                  ReviewStatus, ProvenanceKind, ItsmProvider, ItsmExternalKey
                           FROM dbo.AuditManualEvidenceSubmissions
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId AND ControlId = @ControlId
                           ORDER BY SubmittedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<SubmissionRow> rows = await conn.QueryAsync<SubmissionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId, ControlId = controlId },
                cancellationToken: cancellationToken));

        return rows.Select(MapSubmission).ToList();
    }

    public async Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid submissionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT SubmissionId, TenantId, AssessmentId, ControlId, RequirementId,
                                  Owner, SubmittedBy, SubmittedUtc, ApplicablePeriodStartUtc, ApplicablePeriodEndUtc,
                                  ExpirationUtc, DocumentVersion, DocumentKind, EvidenceHashSha256, BlobPointer,
                                  ReviewStatus, ProvenanceKind, ItsmProvider, ItsmExternalKey
                           FROM dbo.AuditManualEvidenceSubmissions
                           WHERE TenantId = @TenantId AND SubmissionId = @SubmissionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        SubmissionRow? row = await conn.QuerySingleOrDefaultAsync<SubmissionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, SubmissionId = submissionId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapSubmission(row);
    }

    public async Task InsertArchitectureLinkAsync(
        AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(link);

        const string sql = """
                           INSERT INTO dbo.AuditArchitectureEvidenceLinks
                           (LinkId, TenantId, AssessmentId, ControlId, RequirementId, RunId, GoldenManifestId, LinkedBy, LinkedUtc)
                           VALUES
                           (@LinkId, @TenantId, @AssessmentId, @ControlId, @RequirementId, @RunId, @GoldenManifestId, @LinkedBy, @LinkedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                link,
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT LinkId, TenantId, AssessmentId, ControlId, RequirementId, RunId, GoldenManifestId, LinkedBy, LinkedUtc
                           FROM dbo.AuditArchitectureEvidenceLinks
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId
                           ORDER BY LinkedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ArchitectureLinkRow> rows = await conn.QueryAsync<ArchitectureLinkRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId },
                cancellationToken: cancellationToken));

        return rows.Select(MapArchitectureLink).ToList();
    }

    public async Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT LinkId, TenantId, AssessmentId, ControlId, RequirementId, RunId, GoldenManifestId, LinkedBy, LinkedUtc
                           FROM dbo.AuditArchitectureEvidenceLinks
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId AND ControlId = @ControlId
                           ORDER BY LinkedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ArchitectureLinkRow> rows = await conn.QueryAsync<ArchitectureLinkRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId, ControlId = controlId },
                cancellationToken: cancellationToken));

        return rows.Select(MapArchitectureLink).ToList();
    }

    private static AuditManualEvidenceSubmissionRecord MapSubmission(SubmissionRow row) =>
        new()
        {
            SubmissionId = row.SubmissionId,
            TenantId = row.TenantId,
            AssessmentId = row.AssessmentId,
            ControlId = row.ControlId,
            RequirementId = row.RequirementId,
            Owner = row.Owner,
            SubmittedBy = row.SubmittedBy,
            SubmittedUtc = row.SubmittedUtc,
            ApplicablePeriodStartUtc = row.ApplicablePeriodStartUtc,
            ApplicablePeriodEndUtc = row.ApplicablePeriodEndUtc,
            ExpirationUtc = row.ExpirationUtc,
            DocumentVersion = row.DocumentVersion,
            DocumentKind = row.DocumentKind,
            EvidenceHashSha256 = row.EvidenceHashSha256,
            BlobPointer = row.BlobPointer,
            ReviewStatus = (AuditEvidenceReviewStatus)row.ReviewStatus,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            ItsmProvider = row.ItsmProvider,
            ItsmExternalKey = row.ItsmExternalKey,
        };

    private static AuditArchitectureEvidenceLinkRecord MapArchitectureLink(ArchitectureLinkRow row) =>
        new()
        {
            LinkId = row.LinkId,
            TenantId = row.TenantId,
            AssessmentId = row.AssessmentId,
            ControlId = row.ControlId,
            RequirementId = row.RequirementId,
            RunId = row.RunId,
            GoldenManifestId = row.GoldenManifestId,
            LinkedBy = row.LinkedBy,
            LinkedUtc = row.LinkedUtc,
        };

    private sealed class SubmissionRow
    {
        public Guid SubmissionId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid AssessmentId
        {
            get;
            init;
        }

        public Guid ControlId
        {
            get;
            init;
        }

        public Guid RequirementId
        {
            get;
            init;
        }

        public string Owner
        {
            get;
            init;
        } = string.Empty;

        public string SubmittedBy
        {
            get;
            init;
        } = string.Empty;

        public DateTime SubmittedUtc
        {
            get;
            init;
        }

        public DateTime? ApplicablePeriodStartUtc
        {
            get;
            init;
        }

        public DateTime? ApplicablePeriodEndUtc
        {
            get;
            init;
        }

        public DateTime? ExpirationUtc
        {
            get;
            init;
        }

        public string? DocumentVersion
        {
            get;
            init;
        }

        public string DocumentKind
        {
            get;
            init;
        } = string.Empty;

        public byte[] EvidenceHashSha256
        {
            get;
            init;
        } = [];

        public string BlobPointer
        {
            get;
            init;
        } = string.Empty;

        public int ReviewStatus
        {
            get;
            init;
        }

        public int ProvenanceKind
        {
            get;
            init;
        }

        public string? ItsmProvider
        {
            get;
            init;
        }

        public string? ItsmExternalKey
        {
            get;
            init;
        }
    }

    private sealed class ArchitectureLinkRow
    {
        public Guid LinkId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid AssessmentId
        {
            get;
            init;
        }

        public Guid ControlId
        {
            get;
            init;
        }

        public Guid RequirementId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public Guid GoldenManifestId
        {
            get;
            init;
        }

        public string LinkedBy
        {
            get;
            init;
        } = string.Empty;

        public DateTime LinkedUtc
        {
            get;
            init;
        }
    }
}
