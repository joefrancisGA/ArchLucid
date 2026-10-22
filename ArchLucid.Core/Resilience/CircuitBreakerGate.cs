using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Time;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Resilience;

/// <summary>
///     Thread-safe three-state circuit breaker (closed → open → half-open probe → closed).
/// </summary>
/// <remarks>
///     One probe at a time in half-open; concurrent callers receive <see cref="CircuitBreakerOpenException" />
///     while a probe is in flight. User-initiated cancellation during a probe clears the probe slot without
///     counting as a failure so the next request can retry immediately.
/// </remarks>
public sealed partial class CircuitBreakerGate
{
    private readonly Action<CircuitBreakerAuditEntry>? _onAuditEntry;
    private readonly CircuitBreakerOptions? _options;

    private readonly IOptionsMonitor<CircuitBreakerOptions>? _optionsMonitor;

    private readonly Lock _sync = new();

    private readonly TimeProvider _timeProvider;

    private int _consecutiveFailures;

    private int _halfOpenSuccessCount;

    private string? _lastOpenReason;

    private DateTimeOffset? _lastStateChangeUtc;

    private DateTimeOffset _openUntilUtc;

    private bool _probeInFlight;

    private State _state = State.Closed;

    /// <param name="gateName">Stable low-cardinality label for metrics (e.g. keyed DI name).</param>
    /// <param name="options">Threshold and open duration.</param>
    /// <param name="timeProvider">Wall clock; defaults to <see cref="TimeProvider.System" />.</param>
    /// <param name="onAuditEntry">Optional durable-audit hook (must not throw); invoked after OTel counters.</param>
    public CircuitBreakerGate(
        string gateName,
        CircuitBreakerOptions options,
        TimeProvider? timeProvider = null,
        Action<CircuitBreakerAuditEntry>? onAuditEntry = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(gateName);
        ArgumentNullException.ThrowIfNull(options);
        options.ApplyDefaults();
        GateName = gateName;
        _options = options;
        _optionsMonitor = null;
        _timeProvider = timeProvider ?? TimeProvider.System;
        _onAuditEntry = onAuditEntry;
    }

    /// <param name="gateName"></param>
    /// <param name="optionsMonitor">
    ///     Named options monitor; <see cref="IOptionsMonitor{TOptions}.Get" /> uses
    ///     <paramref name="gateName" />.
    /// </param>
    /// <param name="timeProvider"></param>
    /// <param name="onAuditEntry"></param>
    public CircuitBreakerGate(
        string gateName,
        IOptionsMonitor<CircuitBreakerOptions> optionsMonitor,
        TimeProvider? timeProvider = null,
        Action<CircuitBreakerAuditEntry>? onAuditEntry = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(gateName);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        GateName = gateName;
        _options = null;
        _optionsMonitor = optionsMonitor;
        _timeProvider = timeProvider ?? TimeProvider.System;
        _onAuditEntry = onAuditEntry;
    }

    /// <summary>Compatibility constructor: wraps <paramref name="utcNow" /> in a <see cref="TimeProvider" />.</summary>
    public CircuitBreakerGate(
        string gateName,
        CircuitBreakerOptions options,
        Func<DateTimeOffset>? utcNow,
        Action<CircuitBreakerAuditEntry>? onAuditEntry)
        : this(
            gateName,
            options,
            utcNow is null ? null : new DelegateTimeProvider(utcNow),
            onAuditEntry)
    {
    }

    /// <summary>Compatibility constructor: wraps <paramref name="utcNow" /> in a <see cref="TimeProvider" />.</summary>
    public CircuitBreakerGate(
        string gateName,
        IOptionsMonitor<CircuitBreakerOptions> optionsMonitor,
        Func<DateTimeOffset>? utcNow,
        Action<CircuitBreakerAuditEntry>? onAuditEntry)
        : this(
            gateName,
            optionsMonitor,
            utcNow is null ? null : new DelegateTimeProvider(utcNow),
            onAuditEntry)
    {
    }

    /// <summary>Compatibility constructor: wraps <paramref name="utcNow" /> in a <see cref="TimeProvider" />.</summary>
    public CircuitBreakerGate(string gateName, CircuitBreakerOptions options, Func<DateTimeOffset>? utcNow)
        : this(gateName, options, utcNow is null ? null : new DelegateTimeProvider(utcNow))
    {
    }

    /// <summary>Compatibility constructor: wraps <paramref name="utcNow" /> in a <see cref="TimeProvider" />.</summary>
    public CircuitBreakerGate(string gateName, IOptionsMonitor<CircuitBreakerOptions> optionsMonitor,
        Func<DateTimeOffset>? utcNow)
        : this(gateName, optionsMonitor, utcNow is null ? null : new DelegateTimeProvider(utcNow))
    {
    }

    /// <summary>Stable low-cardinality gate label (e.g. keyed DI name).</summary>
    public string GateName
    {
        get;
    }

    /// <summary>Thread-safe snapshot of the internal state (<c>Closed</c>, <c>Open</c>, or <c>HalfOpen</c>).</summary>
    public string CurrentState
    {
        get
        {
            lock (_sync)

                return _state.ToString();
        }
    }

    /// <summary>Consecutive failure ticks in the closed state (or threshold after half-open failure); thread-safe snapshot.</summary>
    public int ConsecutiveFailureCount
    {
        get
        {
            lock (_sync)

                return _consecutiveFailures;
        }
    }

    /// <summary>Effective failure threshold from bound or monitored options.</summary>
    public int CurrentFailureThreshold
    {
        get
        {
            lock (_sync)

                return ResolveOptions().FailureThreshold;
        }
    }

    /// <summary>Effective break duration from bound or monitored options.</summary>
    public int CurrentDurationOfBreakSeconds
    {
        get
        {
            lock (_sync)

                return ResolveOptions().DurationOfBreakSeconds;
        }
    }

    /// <summary>Effective half-open success streak required before closing.</summary>
    public int CurrentHalfOpenSuccessThreshold
    {
        get
        {
            lock (_sync)

                return ResolveOptions().HalfOpenSuccessThreshold;
        }
    }

    /// <summary>
    ///     Why the circuit last opened (<c>consecutive_failures</c> or <c>half_open_probe_failed</c>); null when closed.
    /// </summary>
    public string? LastOpenReason
    {
        get
        {
            lock (_sync)

                return _lastOpenReason;
        }
    }

    /// <summary>
    ///     UTC time of the last <c>Closed</c>↔<c>Open</c>↔<c>HalfOpen</c> transition; <see langword="null" /> until the
    ///     first transition.
    /// </summary>
    public DateTimeOffset? LastStateChangeUtc
    {
        get
        {
            lock (_sync)

                return _lastStateChangeUtc;
        }
    }

    private CircuitBreakerOptions ResolveOptions()
    {
        if (_optionsMonitor is null)
            return _options!;

        CircuitBreakerOptions resolved = _optionsMonitor.Get(GateName);
        resolved.ApplyDefaults();

        return resolved;
    }

    private enum State
    {
        Closed,
        Open,
        HalfOpen
    }
}
