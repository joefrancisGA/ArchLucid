using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

public sealed partial class RiskExceptionService(
    IRiskExceptionRepository repository,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IFindingInspectReadRepository findingInspectReadRepository,
    IAuditService auditService,
    ILogger<RiskExceptionService> logger) : IRiskExceptionService;
