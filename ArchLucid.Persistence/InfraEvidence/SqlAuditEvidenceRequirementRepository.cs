using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditEvidenceRequirementRepository(ISqlConnectionFactory connectionFactory)
    : IAuditEvidenceRequirementRepository
{
    public async Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT RequirementId, ControlId, FrameworkId, TenantId, Name, Description, EvidenceType,
                                  RequiredAzureScopes, RequiredResourceTypes, CollectionMethod, Frequency,
                                  EvaluationMethod, ManualEvidenceAllowed, RequiredFreshness, AutomationClass
                           FROM dbo.AuditEvidenceRequirements
                           WHERE TenantId = @TenantId AND FrameworkId = @FrameworkId
                           ORDER BY EvidenceType, Name;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RequirementRow> rows = await conn.QueryAsync<RequirementRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, FrameworkId = frameworkId },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
        Guid tenantId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT RequirementId, ControlId, FrameworkId, TenantId, Name, Description, EvidenceType,
                                  RequiredAzureScopes, RequiredResourceTypes, CollectionMethod, Frequency,
                                  EvaluationMethod, ManualEvidenceAllowed, RequiredFreshness, AutomationClass
                           FROM dbo.AuditEvidenceRequirements
                           WHERE TenantId = @TenantId AND ControlId = @ControlId
                           ORDER BY EvidenceType, Name;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RequirementRow> rows = await conn.QueryAsync<RequirementRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ControlId = controlId },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static AuditEvidenceRequirementRecord Map(RequirementRow row) =>
        new()
        {
            RequirementId = row.RequirementId,
            ControlId = row.ControlId,
            FrameworkId = row.FrameworkId,
            TenantId = row.TenantId,
            Name = row.Name,
            Description = row.Description,
            EvidenceType = row.EvidenceType,
            RequiredAzureScopes = row.RequiredAzureScopes,
            RequiredResourceTypes = row.RequiredResourceTypes,
            CollectionMethod = row.CollectionMethod,
            Frequency = row.Frequency,
            EvaluationMethod = row.EvaluationMethod,
            ManualEvidenceAllowed = row.ManualEvidenceAllowed,
            RequiredFreshness = row.RequiredFreshness,
            AutomationClass = (AuditEvidenceAutomationClass)row.AutomationClass,
        };

    private sealed class RequirementRow
    {
        public Guid RequirementId
        {
            get;
            init;
        }

        public Guid ControlId
        {
            get;
            init;
        }

        public Guid FrameworkId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string? Description
        {
            get;
            init;
        }

        public string EvidenceType
        {
            get;
            init;
        } = string.Empty;

        public string? RequiredAzureScopes
        {
            get;
            init;
        }

        public string? RequiredResourceTypes
        {
            get;
            init;
        }

        public string? CollectionMethod
        {
            get;
            init;
        }

        public string? Frequency
        {
            get;
            init;
        }

        public string? EvaluationMethod
        {
            get;
            init;
        }

        public bool ManualEvidenceAllowed
        {
            get;
            init;
        }

        public string? RequiredFreshness
        {
            get;
            init;
        }

        public int AutomationClass
        {
            get;
            init;
        }
    }
}
