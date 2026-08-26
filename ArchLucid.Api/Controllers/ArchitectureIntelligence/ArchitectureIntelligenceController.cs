using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

/// <summary>Operator closed-loop architecture reasoning and golden regression checks.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture-intelligence")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ArchitectureIntelligenceController(
    IClosedLoopArchitectureReasoningOrchestrator reasoningOrchestrator,
    IGoldenArchitectureTestRunner goldenArchitectureTestRunner,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
    IArchitectureIntelligenceProductPublishService productPublishService,
    IArchitectureIntelligenceProductRunSourceContextLoader productRunSourceContextLoader,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _reasoningOrchestrator =
        reasoningOrchestrator ?? throw new ArgumentNullException(nameof(reasoningOrchestrator));

    private readonly IGoldenArchitectureTestRunner _goldenArchitectureTestRunner =
        goldenArchitectureTestRunner ?? throw new ArgumentNullException(nameof(goldenArchitectureTestRunner));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureIntelligenceProductPublishService _productPublishService =
        productPublishService ?? throw new ArgumentNullException(nameof(productPublishService));

    private readonly IArchitectureIntelligenceProductRunSourceContextLoader _productRunSourceContextLoader =
        productRunSourceContextLoader ?? throw new ArgumentNullException(nameof(productRunSourceContextLoader));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private bool TryPrepareRequest(
        ClosedLoopReasoningRequest? request,
        bool allowEmptySourcesForFixture,
        bool requireSourcesUnlessContinue,
        out ClosedLoopReasoningRequest prepared,
        out string? validationError,
        out bool bodyRequired)
    {
        bodyRequired = false;

        if (request is null)
        {
            prepared = null!;
            validationError = null;
            bodyRequired = true;

            return false;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string tenantId = scope.TenantId.ToString("D");
        request.TenantId = tenantId;
        request.WorkspaceId = scope.WorkspaceId.ToString("D");
        request.ProjectId = scope.ProjectId.ToString("D");

        bool hasContent = request.SourceTexts is not null
            && request.SourceTexts.Any(source => !string.IsNullOrWhiteSpace(source.Content));

        if (!hasContent && allowEmptySourcesForFixture && request.UseGoldenFixture)
        {
            ClosedLoopReasoningRequest fixture = GoldenIncompleteArchitectureFixture.CreateRequest(tenantId);
            request.SourceTexts = fixture.SourceTexts;
            request.DeclaredPriorities = fixture.DeclaredPriorities.Count > 0
                ? fixture.DeclaredPriorities
                : request.DeclaredPriorities;
            hasContent = true;
        }

        bool continueWithoutSources = request.ContinueFromExistingRun && !string.IsNullOrWhiteSpace(request.RunId);

        if (requireSourcesUnlessContinue && !continueWithoutSources && (request.SourceTexts is null || request.SourceTexts.Count == 0 || !hasContent))
        {
            prepared = request;
            validationError = "At least one source text with content is required (or set useGoldenFixture=true).";

            return false;
        }

        if (!requireSourcesUnlessContinue && !continueWithoutSources)
        {
            prepared = request;
            validationError = "Continue requests require a runId.";

            return false;
        }

        prepared = request;
        validationError = null;

        return true;
    }
}
