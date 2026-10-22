using System.Threading.Tasks;

using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Owns <see cref="OutboxLeaseFinalizeModel"/> for Coyote DST exploration (Prompt 15).</summary>
[OnEventDoAction(typeof(OutboxLeaseFinalizeCoyoteApplyEvent), nameof(OnApply))]
[OnEventDoAction(typeof(OutboxLeaseFinalizeCoyotePrepareFinalizeEvent), nameof(OnPrepareFinalize))]
[OnEventDoAction(typeof(OutboxLeaseFinalizeCoyoteWorkerDoneEvent), nameof(OnWorkerDone))]
internal sealed class OutboxLeaseFinalizeCoyoteControllerActor : Actor
{
    private static readonly DateTime BaseUtc = new(2026, 8, 17, 12, 0, 0, DateTimeKind.Utc);

    private OutboxLeaseFinalizeModel _model = new();
    private TaskCompletionSource<bool> _completed = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private int _expectedWorkerDoneSignals;
    private int _workerDoneSignals;

    protected override Task OnInitializeAsync(Event initialEvent)
    {
        if (initialEvent is OutboxLeaseFinalizeCoyoteInitEvent initEvent)
        {
            _model.CoyoteInjectDoubleFinalizeBug = initEvent.InjectDoubleFinalizeBug;
            _completed = initEvent.Completed;
            _expectedWorkerDoneSignals = initEvent.ExpectedWorkerDoneSignals;
        }

        return Task.CompletedTask;
    }

    public void OnApply(Event eventArgument)
    {
        OutboxLeaseFinalizeCoyoteApplyEvent applyEvent = (OutboxLeaseFinalizeCoyoteApplyEvent)eventArgument;
        DateTime utcNow = BaseUtc.AddSeconds(applyEvent.OffsetSeconds);
        _model.TryApply(applyEvent.LifecycleEvent, utcNow);
        OutboxLeaseFinalizeCoyoteInvariants.Assert(_model);
    }

    public void OnPrepareFinalize()
    {
        if (!_model.LeaseHeld)
            _model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc);

        _model.MarkPersistedBeforeLlm();
        _model.MarkReadyForFinalize();
        OutboxLeaseFinalizeCoyoteInvariants.Assert(_model);
    }

    public void OnWorkerDone()
    {
        _workerDoneSignals++;

        if (_workerDoneSignals >= _expectedWorkerDoneSignals)
            _completed.SetResult(true);
    }
}
