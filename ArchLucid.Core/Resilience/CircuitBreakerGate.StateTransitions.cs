namespace ArchLucid.Core.Resilience;

public sealed partial class CircuitBreakerGate
{
    /// <summary>Atomically admits a call and binds its outcome to the current recovery generation.</summary>
    public CallAdmission Admit()
    {
        lock (_sync)
        {
            ThrowIfBroken();
            return new CallAdmission(this, _admissionGeneration, _state == State.HalfOpen);
        }
    }

    /// <summary>Single-use, generation-bound outcome for one admitted provider call.</summary>
    public sealed class CallAdmission
    {
        private readonly CircuitBreakerGate _gate;
        private readonly long _generation;
        private int _completed;

        internal CallAdmission(CircuitBreakerGate gate, long generation, bool isHalfOpenProbe)
        {
            _gate = gate;
            _generation = generation;
            IsHalfOpenProbe = isHalfOpenProbe;
        }

        public bool IsHalfOpenProbe { get; }

        public void RecordSuccess() => Complete(_gate.RecordSuccess);
        public void RecordFailure() => Complete(_gate.RecordFailure);
        public void RecordCallCancelled() => Complete(_gate.RecordCallCancelled);

        private void Complete(Action record)
        {
            if (Interlocked.Exchange(ref _completed, 1) != 0)
                return;

            lock (_gate._sync)
            {
                // A previous closed call must not close or release a newer recovery probe.
                if (_generation == _gate._admissionGeneration)
                    record();
            }
        }
    }

    /// <summary>
    ///     Throws <see cref="CircuitBreakerOpenException" /> if the circuit rejects the call; otherwise returns
    ///     so the caller may invoke the downstream operation (and then call <see cref="RecordSuccess" /> or
    ///     <see cref="RecordFailure" /> / <see cref="RecordCallCancelled" />).
    /// </summary>
    public void ThrowIfBroken()
    {
        lock (_sync)
        {
            if (_state == State.Closed)
                return;

            if (_state == State.Open)
            {
                if (_timeProvider.GetUtcNow() < _openUntilUtc)
                {
                    EmitRejection();

                    throw new CircuitBreakerOpenException(_openUntilUtc);
                }

                if (_probeInFlight)
                {
                    EmitRejection();

                    throw new CircuitBreakerOpenException(
                        "Upstream AI recovery probe in progress; retry shortly.");
                }

                _state = State.HalfOpen;
                _probeInFlight = true;
                EmitStateTransition("Open", "HalfOpen");

                return;
            }

            // HalfOpen: only the probing thread holds the slot; others wait out.

            if (!_probeInFlight)
            {
                // After a successful probe below the configured success threshold,
                // atomically reserve the next slot before admitting another caller.
                _probeInFlight = true;
                return;
            }

            EmitRejection();

            throw new CircuitBreakerOpenException(
                "Upstream AI recovery probe in progress; retry shortly.");
        }
    }

    /// <summary>Call after a successful downstream invocation.</summary>
    public void RecordSuccess()
    {
        lock (_sync)
        {
            if (_state == State.HalfOpen && _probeInFlight)
            {
                EmitProbeOutcome("success");
                _halfOpenSuccessCount++;
                CircuitBreakerOptions opts = ResolveOptions();

                if (_halfOpenSuccessCount >= opts.HalfOpenSuccessThreshold)
                {
                    EmitStateTransition("HalfOpen", "Closed");
                    _consecutiveFailures = 0;
                    _state = State.Closed;
                    _probeInFlight = false;
                    _halfOpenSuccessCount = 0;
                    _lastOpenReason = null;

                    return;
                }

                _probeInFlight = false;

                return;
            }

            _consecutiveFailures = 0;
            _state = State.Closed;
            _probeInFlight = false;
            _halfOpenSuccessCount = 0;
            _lastOpenReason = null;
        }
    }

    /// <summary>Call after a failed downstream invocation (counts toward opening the circuit).</summary>
    public void RecordFailure()
    {
        lock (_sync)
        {
            CircuitBreakerOptions opts = ResolveOptions();

            if (_state == State.HalfOpen)
            {
                EmitProbeOutcome("failure");
                EmitStateTransition("HalfOpen", "Open");
                _state = State.Open;
                _openUntilUtc = _timeProvider.GetUtcNow().AddSeconds(opts.DurationOfBreakSeconds);
                _probeInFlight = false;
                _consecutiveFailures = opts.FailureThreshold;
                _halfOpenSuccessCount = 0;
                _lastOpenReason = "half_open_probe_failed";

                return;
            }

            _consecutiveFailures++;

            if (_consecutiveFailures < opts.FailureThreshold)
                return;

            EmitStateTransition("Closed", "Open");
            _state = State.Open;
            _openUntilUtc = _timeProvider.GetUtcNow().AddSeconds(opts.DurationOfBreakSeconds);
            _lastOpenReason = "consecutive_failures";
        }
    }

    /// <summary>
    ///     Call when the caller canceled the operation so the probe slot is released without a failure tick.
    /// </summary>
    public void RecordCallCancelled()
    {
        lock (_sync)
        {
            if (_state != State.HalfOpen || !_probeInFlight)
                return;

            EmitProbeOutcome("canceled");
            EmitStateTransition("HalfOpen", "Open");
            _probeInFlight = false;
            _state = State.Open;
            _openUntilUtc = _timeProvider.GetUtcNow();
            _halfOpenSuccessCount = 0;
            _lastOpenReason = "half_open_probe_failed";
        }
    }
}
