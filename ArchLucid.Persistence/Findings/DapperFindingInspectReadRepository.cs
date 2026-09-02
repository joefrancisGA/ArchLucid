using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Dapper read joining <c>dbo.FindingRecords</c>, snapshots, runs, optional <c>dbo.DecisioningTraces</c>, and audit.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; covered via API integration tests.")]
public sealed class DapperFindingInspectReadRepository(ISqlConnectionFactory connectionFactory)
    : IFindingInspectReadRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<FindingInspectResponse?> GetInspectAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct,
        FindingInspectReadOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        bool includeTypedPayload = options?.IncludeTypedPayload ?? true;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        string sql = includeTypedPayload
            ? FindingInspectReadSql.MainInspectWithTypedPayload
            : FindingInspectReadSql.MainInspectWithoutTypedPayload;

        MainRow? row = await connection.QuerySingleOrDefaultAsync<MainRow>(
            new CommandDefinition(
                sql,
                new { FindingId = findingId.Trim(), scope.TenantId, scope.WorkspaceId, ScopeProjectId = scope.ProjectId },
                cancellationToken: ct));

        if (row is null)
            return null;

        object queryParams = new
        {
            FindingId = findingId.Trim(),
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            row.RunId,
            EventType = AuditEventTypes.AuthorityCommittedChainPersisted,
            ActiveStatus = "Active",
        };

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(FindingInspectReadSql.FollowUpBatch, queryParams, cancellationToken: ct));

        List<string> relatedNodes = (await multi.ReadAsync<string>()).ToList();
        string? firstRuleText = await multi.ReadSingleOrDefaultAsync<string>();

        List<string> recommendedActions = (await multi.ReadAsync<string>())
            .Where(static a => !string.IsNullOrWhiteSpace(a))
            .ToList();

        Guid? auditRowId = await multi.ReadSingleOrDefaultAsync<Guid?>();
        DispositionRow? dispositionRow = await multi.ReadSingleOrDefaultAsync<DispositionRow>();
        long activeWaiverCount = await multi.ReadSingleAsync<long>();

        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(row.AppliedRuleIdsJson, firstRuleText);

        FindingHumanReviewStatus humanReview = FindingInspectReadModelMapper.ParseHumanReview(row.HumanReviewStatus);

        FindingConfidenceLevel? evaluationLevel =
            FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel(row.EvaluationConfidenceLevel);

        List<FindingInspectEvidenceItem> evidence = relatedNodes
            .Where(static n => !string.IsNullOrWhiteSpace(n))
            .Select(static n =>
                new FindingInspectEvidenceItem { ArtifactId = null, LineRange = null, Excerpt = n.Trim() })
            .ToList();

        JsonElement? typed = includeTypedPayload
            ? FindingInspectReadRepositoryCore.TryParsePayloadJson(row.PayloadJson)
            : FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(row.Title, row.Rationale);
        FindingSeverity recordSeverity = FindingInspectReadModelMapper.ParseFindingSeverity(row.Severity);

        return new FindingInspectResponse
        {
            FindingId = row.FindingId,
            Severity = recordSeverity,
            TypedPayload = typed,
            DecisionRuleId = ruleId,
            DecisionRuleName = ruleName ?? ruleId,
            Evidence = evidence,
            RecommendedActions = recommendedActions,
            AuditRowId = auditRowId,
            RunId = row.RunId,
            ManifestVersion = row.CurrentManifestVersion,
            ModelDeploymentName = row.ModelDeploymentName,
            ModelAlias = row.ModelAlias,
            PromptTemplateVersion = row.PromptTemplateVersion,
            ConfidenceScore = row.ConfidenceScore,
            EvaluationConfidenceScore = row.EvaluationConfidenceScore,
            ConfidenceLevel = evaluationLevel,
            HumanReviewStatus = humanReview,
            IsMuted = row.IsMuted,
            MuteReason = row.MuteReason,
            ReasoningTrace = row.ReasoningTrace,
            ReasoningTraceDigestSha256 = row.ReasoningTraceDigestSha256,
            LatestDisposition = dispositionRow is null
                ? null
                : FindingInspectReadModelMapper.ParseDisposition(dispositionRow.Disposition),
            LatestDispositionOccurredAtUtc = dispositionRow?.OccurredAtUtc,
            HasActiveWaiver = activeWaiverCount > 0,
            AssignedToUserId = row.AssignedToUserId,
            RemediationDueUtc = row.RemediationDueUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.RemediationDueUtc.Value, DateTimeKind.Utc)),
            RunStructuralExecutionMode = row.StructuralExecutionMode,
            RunRealModeFellBackToSimulator = row.RealModeFellBackToSimulator,
        };
    }

    private sealed class MainRow
    {
        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public string Severity
        {
            get;
            init;
        } = string.Empty;

        public string? PayloadJson
        {
            get;
            init;
        }

        public string? Title
        {
            get;
            init;
        }

        public string? Rationale
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public string? CurrentManifestVersion
        {
            get;
            init;
        }

        public Guid? GoldenManifestId
        {
            get;
            init;
        }

        public StructuralExecutionMode StructuralExecutionMode
        {
            get;
            init;
        }

        public bool RealModeFellBackToSimulator
        {
            get;
            init;
        }

        public string? AppliedRuleIdsJson
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }

        public string? ModelAlias
        {
            get;
            init;
        }

        public string? PromptTemplateVersion
        {
            get;
            init;
        }

        public double? ConfidenceScore
        {
            get;
            init;
        }

        public int? EvaluationConfidenceScore
        {
            get;
            init;
        }

        public string? EvaluationConfidenceLevel
        {
            get;
            init;
        }

        public string? HumanReviewStatus
        {
            get;
            init;
        }

        public bool IsMuted
        {
            get;
            init;
        }

        public string? MuteReason
        {
            get;
            init;
        }

        public string? AssignedToUserId
        {
            get;
            init;
        }

        public DateTime? RemediationDueUtc
        {
            get;
            init;
        }

        public string? ReasoningTrace
        {
            get;
            init;
        }

        public string? ReasoningTraceDigestSha256
        {
            get;
            init;
        }
    }

    private sealed class DispositionRow
    {
        public string? Disposition
        {
            get;
            init;
        }

        public DateTimeOffset? OccurredAtUtc
        {
            get;
            init;
        }
    }
}
