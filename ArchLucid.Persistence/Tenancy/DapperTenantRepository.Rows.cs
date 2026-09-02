using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{
    private sealed class WorkspaceRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid DefaultProjectId
        {
            get;
            init;
        }
    }

    private sealed class WorkspaceListRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public Guid DefaultProjectId
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }
    }

    private sealed class TenantSeatRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public int? TrialSeatsLimit
        {
            get;
            init;
        }

        public int TrialSeatsUsed
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }
    }

    private sealed class TrialRunGateRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }
    }

    private sealed class TrialFirstManifestOutputRow
    {
        public int TrialRunsUsed
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialStartUtc
        {
            get;
            init;
        }
    }
}
