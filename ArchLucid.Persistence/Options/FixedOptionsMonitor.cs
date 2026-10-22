using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Options;

/// <summary>
///     Constant <see cref="IOptionsMonitor{TOptions}" /> for hosts that do not use the options configuration pipeline
///     (e.g. CLI tools).
/// </summary>
public sealed class FixedOptionsMonitor<TOptions>(TOptions currentValue) : IOptionsMonitor<TOptions>
    where TOptions : class
{
    public TOptions CurrentValue
    {
        get;
    } = currentValue ?? throw new ArgumentNullException(nameof(currentValue));

    public TOptions Get(string? name)
    {
        return CurrentValue;
    }

    public IDisposable OnChange(Action<TOptions, string?> listener)
    {
        return NoopDisposable.Instance;
    }

    private sealed class NoopDisposable : IDisposable
    {
        internal static readonly NoopDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
