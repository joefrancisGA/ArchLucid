namespace ArchiForge.Persistence.Sql;

public interface ISchemaBootstrapper
{
    Task EnsureSchemaAsync(CancellationToken ct);
}
