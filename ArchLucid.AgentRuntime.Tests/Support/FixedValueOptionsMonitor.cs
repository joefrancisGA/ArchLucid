using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>Minimal <see cref="IOptionsMonitor{TOptions}" /> for unit tests (no reloads).</summary>
public sealed class FixedValueOptionsMonitor<TOptions>(TOptions value) : IOptionsMonitor<TOptions>
    where TOptions : class
{
    private readonly TOptions _value = value ?? throw new ArgumentNullException(nameof(value));

    public TOptions CurrentValue => _value;

    public TOptions Get(string? name) => _value;

    public IDisposable OnChange(Action<TOptions, string?> listener) => NullOptionsChangeDisposable.Instance;

    private sealed class NullOptionsChangeDisposable : IDisposable
    {
        public static NullOptionsChangeDisposable Instance { get; } = new();

        public void Dispose()
        {
        }
    }
}
