using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Architecture;
using Microsoft.Extensions.Logging.Abstractions;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
            _manifestHashService.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
