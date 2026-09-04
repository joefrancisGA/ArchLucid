using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentValidation;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftAdmissionService" />
public sealed partial class DraftAdmissionService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCrudService crudService,
    IDraftAdmissionGate admissionGate,
    IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
    IQuestionSelectionEngine questionSelectionEngine,
    IDraftRequestProjector projector,
    IArchitectureRunCommandService architectureRunCommandService,
    IRequestContentSafetyPrecheck contentSafetyPrecheck,
    FeasibilityVerdictBuilder feasibilityVerdictBuilder,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard,
    IRunRepository runRepository,
    IValidator<ArchitectureRequest> architectureRequestValidator) : IDraftAdmissionService
{
    private readonly IDraftAdmissionGate _admissionGate =
        admissionGate ?? throw new ArgumentNullException(nameof(admissionGate));

    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    private readonly IDraftSemanticAdmissionEvaluator _semanticAdmissionEvaluator =
        semanticAdmissionEvaluator ?? throw new ArgumentNullException(nameof(semanticAdmissionEvaluator));

    private readonly IRequestContentSafetyPrecheck _contentSafetyPrecheck =
        contentSafetyPrecheck ?? throw new ArgumentNullException(nameof(contentSafetyPrecheck));

    private readonly IQuestionSelectionEngine _questionSelectionEngine =
        questionSelectionEngine ?? throw new ArgumentNullException(nameof(questionSelectionEngine));

    private readonly IDraftRequestProjector _projector =
        projector ?? throw new ArgumentNullException(nameof(projector));

    private readonly IArchitectureRunCommandService _architectureRunCommandService =
        architectureRunCommandService ?? throw new ArgumentNullException(nameof(architectureRunCommandService));

    private readonly FeasibilityVerdictBuilder _feasibilityVerdictBuilder =
        feasibilityVerdictBuilder ?? throw new ArgumentNullException(nameof(feasibilityVerdictBuilder));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IValidator<ArchitectureRequest> _architectureRequestValidator =
        architectureRequestValidator ?? throw new ArgumentNullException(nameof(architectureRequestValidator));
}
