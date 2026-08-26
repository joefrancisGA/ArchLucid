using System.Text.Json;
using ArchLucid.Contracts.ArchitectureIntelligence;
using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArchitectureIntelligence;

public sealed partial class DapperArchitectureIntelligencePersistence
{
    public async Task SaveModelAsync(ArchitectureKnowledgeModel model, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        cancellationToken.ThrowIfCancellationRequested();

        Guid tenantId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(model.TenantId);
        DateTime updatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
            MERGE dbo.ArchitectureKnowledgeModels AS target
            USING (SELECT @ModelId AS ModelId) AS source
            ON target.ModelId = source.ModelId
            WHEN MATCHED THEN
                UPDATE SET
                    TenantId = @TenantId,
                    RunId = @RunId,
                    SchemaVersion = @SchemaVersion,
                    ElementsJson = @ElementsJson,
                    DeclaredPrioritiesJson = @DeclaredPrioritiesJson,
                    FramingAnswersJson = @FramingAnswersJson,
                    IsProvisionalSynthesis = @IsProvisionalSynthesis,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT
                (
                    ModelId, TenantId, RunId, SchemaVersion,
                    ElementsJson, DeclaredPrioritiesJson, FramingAnswersJson,
                    IsProvisionalSynthesis,
                    CreatedUtc, UpdatedUtc
                )
                VALUES
                (
                    @ModelId, @TenantId, @RunId, @SchemaVersion,
                    @ElementsJson, @DeclaredPrioritiesJson, @FramingAnswersJson,
                    @IsProvisionalSynthesis,
                    @CreatedUtc, @UpdatedUtc
                );
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                model.ModelId,
                TenantId = tenantId,
                model.RunId,
                model.SchemaVersion,
                ElementsJson = JsonSerializer.Serialize(model.Elements, JsonOptions),
                DeclaredPrioritiesJson = JsonSerializer.Serialize(model.DeclaredPriorities, JsonOptions),
                FramingAnswersJson = JsonSerializer.Serialize(model.FramingAnswers, JsonOptions),
                IsProvisionalSynthesis = model.IsProvisionalSynthesis,
                CreatedUtc = model.CreatedUtc == default ? updatedUtc : model.CreatedUtc,
                UpdatedUtc = updatedUtc,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<ArchitectureKnowledgeModel?> GetModelAsync(
        string tenantId,
        string modelId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(modelId))
        {
            return null;
        }

        Guid tenantGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId);

        const string sql = """
            SELECT
                ModelId,
                TenantId,
                RunId,
                SchemaVersion,
                ElementsJson,
                DeclaredPrioritiesJson,
                FramingAnswersJson,
                IsProvisionalSynthesis,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.ArchitectureKnowledgeModels
            WHERE ModelId = @ModelId AND TenantId = @TenantId;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ModelRow? row = await connection.QueryFirstOrDefaultAsync<ModelRow>(
            new CommandDefinition(
                sql,
                new
                {
                    ModelId = modelId,
                    TenantId = tenantGuid,
                },
                cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        return MapModelRow(row, tenantId);
    }

    public async Task<ArchitectureKnowledgeModel?> GetModelByRunIdAsync(
        string tenantId,
        string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return null;
        }

        Guid tenantGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId);

        const string sql = """
            SELECT TOP 1
                ModelId,
                TenantId,
                RunId,
                SchemaVersion,
                ElementsJson,
                DeclaredPrioritiesJson,
                FramingAnswersJson,
                IsProvisionalSynthesis,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.ArchitectureKnowledgeModels
            WHERE TenantId = @TenantId AND RunId = @RunId
            ORDER BY UpdatedUtc DESC;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ModelRow? row = await connection.QueryFirstOrDefaultAsync<ModelRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantGuid,
                    RunId = runId,
                },
                cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        return MapModelRow(row, tenantId);
    }

    private static ArchitectureKnowledgeModel MapModelRow(ModelRow row, string tenantId)
    {
        List<ArchitectureModelElement> elements = JsonSerializer.Deserialize<List<ArchitectureModelElement>>(
            row.ElementsJson,
            JsonOptions) ?? [];

        List<string> priorities = JsonSerializer.Deserialize<List<string>>(
            row.DeclaredPrioritiesJson,
            JsonOptions) ?? [];

        Dictionary<string, string> framingAnswers = JsonSerializer.Deserialize<Dictionary<string, string>>(
            row.FramingAnswersJson,
            JsonOptions) ?? new Dictionary<string, string>();

        return new ArchitectureKnowledgeModel
        {
            ModelId = row.ModelId,
            TenantId = tenantId,
            RunId = row.RunId,
            SchemaVersion = row.SchemaVersion,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            Elements = elements,
            DeclaredPriorities = priorities,
            FramingAnswers = framingAnswers,
            IsProvisionalSynthesis = row.IsProvisionalSynthesis,
        };
    }

    private sealed class ModelRow
    {
        public string ModelId
        {
            get;
            init;
        } = null!;

        public Guid TenantId
        {
            get;
            init;
        }

        public string? RunId
        {
            get;
            init;
        }

        public int SchemaVersion
        {
            get;
            init;
        }

        public string ElementsJson
        {
            get;
            init;
        } = "[]";

        public string DeclaredPrioritiesJson
        {
            get;
            init;
        } = "[]";

        public string FramingAnswersJson
        {
            get;
            init;
        } = "{}";

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public bool IsProvisionalSynthesis
        {
            get;
            init;
        }
    }
}
