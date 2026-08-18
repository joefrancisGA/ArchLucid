using Microsoft.Coyote.Actors;
using Microsoft.Coyote.Tasks;

namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Owns <see cref="OutboxLeaseFinalizeModel"/> for Coyote DST exploration (Prompt 15).</summary>
internal sealed class OutboxLeaseFinalizeCoyoteControllerActor : Actor
{
    private static readonly DateTime BaseUtc = new(2026, 8, 17, 12, 0, 0, DateTimeKind.Utc);

    private OutboxLeaseFinalizeModel _model = new();
    private TaskCompletionSource<bool> _completed = TaskCompletionSource.Create<bool>();
    private int _expectedWorkerDoneSignals;
    private int _workerDoneSignals;

    protected override void OnInitialize(Event initialEvent)
    {
        if (initialEvent is not OutboxLeaseFinalizeCoyoteInitEvent initEvent)
            return;

        _model.CoyoteInjectDoubleFinalizeBug = initEvent.InjectDoubleFinalizeBug;
        _completed = initEvent.Completed;
        _expectedWorkerDoneSignals = initEvent.ExpectedWorkerDoneSignals;
    }

    [OnEventDoAction(typeof(OutboxLeaseFinalizeCoyoteApplyEvent))]
    private void OnApply(OutboxLeaseFinalizeCoyoteApplyEvent applyEvent)
    {
        DateTime utcNow = BaseUtc.AddSeconds(applyEvent.OffsetSeconds);
        _model.TryApply(applyEvent.LifecycleEvent, utcNow);
        OutboxLeaseFinalizeCoyoteInvariants.Assert(_model);
    }

    [OnEventDoAction(typeof(OutboxLeaseFinalizeCoyotePrepareFinalizeEvent))]
    private void OnPrepareFinalize()
    {
        if (!_model.LeaseHeld)
            _model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc);

        _model.MarkPersistedBeforeLlm();
        _model.MarkReadyForFinalize();
        OutboxLeaseFinalizeCoyoteInvariants.Assert(_model);
    }

    [OnEventDoAction(typeof(OutboxLeaseFinalizeCoyoteWorkerDoneEvent))]
    private void OnWorkerDone()
    {
        _workerDoneSignals++;

        if (_workerDoneSignals >= _expectedWorkerDoneSignals)
            _completed.SetResult(true);
    }
}
