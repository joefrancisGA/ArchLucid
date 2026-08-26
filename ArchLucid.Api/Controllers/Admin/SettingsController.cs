using ArchLucid.Application.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Per-tenant admin settings overrides (requires <see cref="ArchLucidPolicies.AdminAuthority" />).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/settings")]
public sealed partial class SettingsController(
    ITenantAgentOutputQualityGateModeService qualityGateModeService,
    ITenantFindingEngineControlsService findingEngineControlsService,
    IWorkspaceModelExecutionProfileService workspaceModelExecutionProfileService,
    IWorkspaceAllowedEngineSetService workspaceAllowedEngineSetService,
    IExternalSubprocessorEngineAcknowledgmentService externalSubprocessorEngineAcknowledgmentService,
    IAgentModelAliasRegistry agentModelAliasRegistry,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IAuditRepository auditRepository,
    TimeProvider timeProvider) : ControllerBase
{
    private readonly ITenantAgentOutputQualityGateModeService _qualityGateModeService =
        qualityGateModeService ?? throw new ArgumentNullException(nameof(qualityGateModeService));

    private readonly ITenantFindingEngineControlsService _findingEngineControlsService =
        findingEngineControlsService ?? throw new ArgumentNullException(nameof(findingEngineControlsService));

    private readonly IWorkspaceModelExecutionProfileService _workspaceModelExecutionProfileService =
        workspaceModelExecutionProfileService ?? throw new ArgumentNullException(nameof(workspaceModelExecutionProfileService));

    private readonly IWorkspaceAllowedEngineSetService _workspaceAllowedEngineSetService =
        workspaceAllowedEngineSetService ?? throw new ArgumentNullException(nameof(workspaceAllowedEngineSetService));

    private readonly IExternalSubprocessorEngineAcknowledgmentService _externalSubprocessorEngineAcknowledgmentService =
        externalSubprocessorEngineAcknowledgmentService
        ?? throw new ArgumentNullException(nameof(externalSubprocessorEngineAcknowledgmentService));

    private readonly IAgentModelAliasRegistry _agentModelAliasRegistry =
        agentModelAliasRegistry ?? throw new ArgumentNullException(nameof(agentModelAliasRegistry));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
