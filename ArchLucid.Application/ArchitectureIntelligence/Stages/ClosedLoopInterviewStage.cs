using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class ClosedLoopInterviewStage(IProgressiveInterviewService interviewService) : IClosedLoopInterviewStage
{
    private readonly IProgressiveInterviewService _interviewService =
        interviewService ?? throw new ArgumentNullException(nameof(interviewService));

    public Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        ClosedLoopReasoningRequest effectiveRequest = context.EffectiveRequest;
        ProgressiveInterviewState interview = _interviewService.BuildFramingState(
            context.Model,
            effectiveRequest.SourceTexts);

        if (effectiveRequest.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(context.Model, interview, effectiveRequest.FramingAnswers);
        }

        context.Interview = interview;

        return Task.CompletedTask;
    }
}
