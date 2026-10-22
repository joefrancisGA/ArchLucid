using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>Minimal <see cref="IOptionsMonitor{TOptions}" /> for unit tests (no reloads).</summary>
public sealed class FixedValueOptionsMonitor<TOptions>(TOptions value) : IOptionsMonitor<TOptions>
    where TOptions : class
{
    public TOptions CurrentValue
    {
        get;
    } = value ?? throw new ArgumentNullException(nameof(value));

    public TOptions Get(string? name) => CurrentValue;

    public IDisposable OnChange(Action<TOptions, string?> listener) => NullOptionsChangeDisposable.Instance;

    private sealed class NullOptionsChangeDisposable : IDisposable
    {
        public static NullOptionsChangeDisposable Instance { get; } = new();

        public void Dispose()
        {
        }
    }
}
