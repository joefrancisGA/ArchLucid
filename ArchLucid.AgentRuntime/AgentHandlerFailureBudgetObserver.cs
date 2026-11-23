namespace ArchLucid.AgentRuntime;

/// <summary>
/// Bounded, observation-only FND-018 handler failure budget. This does not admit,
/// reject, retry, or recover any work; Polly remains the execution authority.
/// </summary>
internal sealed class AgentHandlerFailureBudgetObserver
{
    internal const int MaxTrackedDispatchKeys = 64;
    internal const int MinRequests = 5;
    internal const int MaxFailures = 5;
    internal static readonly TimeSpan WindowDuration = TimeSpan.FromMinutes(1);

    private readonly object _sync = new();
    private readonly Dictionary<string, Window> _windows = new(StringComparer.OrdinalIgnoreCase);

    internal int TrackedDispatchKeys
    {
        get
        {
            lock (_sync)
                return _windows.Count;
        }
    }

    internal AgentHandlerFailureBudgetSnapshot Observe(
        string dispatchKey,
        AgentHandlerFailureBudgetOutcome outcome,
        DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dispatchKey);

        lock (_sync)
        {
            // Caller cancellation never consumes the failure budget or opens a window.
            if (outcome == AgentHandlerFailureBudgetOutcome.CallerCancelled)
                return _windows.TryGetValue(dispatchKey, out Window? prior)
                    ? Snapshot(prior, counted: false, newlyExhausted: false)
                    : default;

            if (!_windows.TryGetValue(dispatchKey, out Window? window))
            {
                // Custom dispatch keys are allowed. Cap host-wide observation state so
                // unbounded custom keys cannot create an unbounded metrics cache.
                if (_windows.Count >= MaxTrackedDispatchKeys)
                    EvictOldest();

                window = new Window(now);
                _windows.Add(dispatchKey, window);
            }
            else if (now < window.Started || now - window.Started >= WindowDuration)
            {
                // An expired interval or a wall-clock regression starts a new window.
                window = new Window(now);
                _windows[dispatchKey] = window;
            }

            bool wasExhausted = IsExhausted(window);
            window.Requests++;
            if (outcome == AgentHandlerFailureBudgetOutcome.Failure)
                window.Failures++;
            window.LastObserved = now;

            return Snapshot(window, counted: true, newlyExhausted: !wasExhausted && IsExhausted(window));
        }
    }

    private void EvictOldest()
    {
        string? oldestKey = null;
        DateTimeOffset oldestTime = DateTimeOffset.MaxValue;

        foreach (KeyValuePair<string, Window> entry in _windows)
        {
            if (entry.Value.LastObserved >= oldestTime)
                continue;

            oldestKey = entry.Key;
            oldestTime = entry.Value.LastObserved;
        }

        if (oldestKey is not null)
            _windows.Remove(oldestKey);
    }

    private static bool IsExhausted(Window window) =>
        window.Requests >= MinRequests && window.Failures >= MaxFailures;

    private static AgentHandlerFailureBudgetSnapshot Snapshot(
        Window window,
        bool counted,
        bool newlyExhausted) =>
        new(window.Requests, window.Failures, IsExhausted(window), counted, newlyExhausted);

    private sealed class Window(DateTimeOffset started)
    {
        internal DateTimeOffset Started { get; } = started;
        internal DateTimeOffset LastObserved { get; set; } = started;
        internal int Requests { get; set; }
        internal int Failures { get; set; }
    }
}

internal enum AgentHandlerFailureBudgetOutcome
{
    Success,
    Failure,
    CallerCancelled,
}

internal readonly record struct AgentHandlerFailureBudgetSnapshot(
    int Requests,
    int Failures,
    bool Exhausted,
    bool Counted,
    bool NewlyExhausted);
