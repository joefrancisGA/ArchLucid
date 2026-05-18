using System.Threading;

using ArchLucid.Core.Diagnostics;

using DbUp.Engine;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     DbUp <see cref="SqlScript" /> that records a single <see cref="ArchLucidInstrumentation.CatalogMigrationRls108ReplayNotesTotal" />
///     increment the first time <see cref="Contents" /> is read (before SQL Server executes the RLS rename migration).
/// </summary>
internal sealed class CatalogMigration108ReplayNoteSqlScript : SqlScript
{
    private const string EncounterKindDbUpExecute = "dbup_execute";

    private readonly string _tenantScope;

    private int _noted;

    public CatalogMigration108ReplayNoteSqlScript(string name, string contents, string tenantScope)
        : base(name, contents)
    {
        _tenantScope = tenantScope ?? throw new ArgumentNullException(nameof(tenantScope));
    }

    public override string Contents
    {
        get
        {
            if (Interlocked.Exchange(ref _noted, 1) == 0)
                ArchLucidInstrumentation.RecordCatalogMigrationRls108ReplayNote("108", _tenantScope, EncounterKindDbUpExecute);

            return base.Contents;
        }
    }
}
