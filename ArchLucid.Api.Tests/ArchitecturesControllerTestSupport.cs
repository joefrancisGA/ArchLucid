using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.Support;
using ArchLucid.Api.Tests.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

internal static class ArchitecturesControllerTestSupport
{
    public static ArchitecturesController BuildController(
        Mock<IScopeContextProvider> scopeProvider,
        Mock<IActorContext> actorContext,
        Mock<IArchitectureIdentityService> identityService,
        Mock<IArchitectureInventoryBindingService> bindingService,
        Mock<IArchitectureSealDeltaService> sealDeltaService,
        Mock<IAuditService> auditService,
        Mock<IRunRepository> runRepository,
        Mock<IGoldenManifestRepository> goldenManifestRepository,
        Mock<IArchitectureShareService>? shareService = null,
        Mock<ArchitectureShareAuditSupport>? shareAuditSupport = null,
        Mock<IArchitectureShareAccessGate>? shareAccessGate = null)
    {
        Mock<IArchitectureShareService> resolvedShareService = shareService ?? new Mock<IArchitectureShareService>();
        ArchitectureShareAuditSupport resolvedShareAuditSupport = shareAuditSupport?.Object
            ?? new ArchitectureShareAuditSupport(
                auditService.Object,
                NullLogger<ArchitectureShareAuditSupport>.Instance);
        Mock<IArchitectureShareAccessGate> resolvedShareAccessGate =
            shareAccessGate ?? ArchitectureShareAccessGateTestDefaults.CreatePermissiveGate();

        return new ArchitecturesController(
            scopeProvider.Object,
            actorContext.Object,
            identityService.Object,
            bindingService.Object,
            new ArchitectureInventoryBindingAuditSupport(
                auditService.Object,
                NullLogger<ArchitectureInventoryBindingAuditSupport>.Instance),
            resolvedShareService.Object,
            resolvedShareAuditSupport,
            resolvedShareAccessGate.Object,
            sealDeltaService.Object,
            auditService.Object,
            runRepository.Object,
            goldenManifestRepository.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
