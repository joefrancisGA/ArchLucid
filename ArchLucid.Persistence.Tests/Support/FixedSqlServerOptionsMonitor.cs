using ArchLucid.Persistence.Connections;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>Minimal <see cref="IOptionsMonitor{TOptions}"/> for integration tests (mutable <see cref="SqlServerOptions"/> instance).</summary>
public sealed class FixedSqlServerOptionsMonitor(SqlServerOptions instance) : IOptionsMonitor<SqlServerOptions>
{
    private readonly SqlServerOptions _instance =
        instance ?? throw new ArgumentNullException(nameof(instance));

    public SqlServerOptions CurrentValue => _instance;

    public SqlServerOptions Get(string? name) => _instance;

    public IDisposable OnChange(Action<SqlServerOptions, string> listener) => NoopDisposable.Instance;

    private sealed class NoopDisposable : IDisposable
    {
        internal static readonly NoopDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
