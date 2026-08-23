using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Persistence.Governance.Posture;

namespace ArchLucid.Application.Governance.Posture;

public sealed class ArchitecturePostureService(
    IArchitecturePostureReader reader,
    IExaminationStateResolver examinationStateResolver) : IArchitecturePostureService
{
    public const string ReadFailureReason = "Architecture posture data could not be loaded.";

    private readonly IArchitecturePostureReader _reader =
        reader ?? throw new ArgumentNullException(nameof(reader));

    private readonly IExaminationStateResolver _examinationStateResolver =
        examinationStateResolver ?? throw new ArgumentNullException(nameof(examinationStateResolver));

    public async Task<ArchitecturePostureSummary> GetSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        bool packAssignmentsAvailable = true,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (projectId == Guid.Empty)
            throw new ArgumentException("Project id is required.", nameof(projectId));

        ArchitecturePostureReadModel readModel;

        try
        {
            readModel = await _reader.ReadAsync(tenantId, workspaceId, projectId, cancellationToken);
        }
        catch (Exception)
        {
            return BuildDegradedSummary();
        }

        Dictionary<string, PillarFindingAggregate> aggregatesByPillar = readModel.PillarAggregates
            .ToDictionary(aggregate => aggregate.PillarKey, StringComparer.Ordinal);

        List<PillarPosture> pillars = ArchitecturePillarCatalog.All
            .Select(catalogEntry => BuildPillarPosture(
                catalogEntry,
                aggregatesByPillar,
                readModel,
                packAssignmentsAvailable))
            .ToList();

        return new ArchitecturePostureSummary
        {
            Pillars = pillars,
            ReviewIntegrity = readModel.ReviewIntegrity,
            UncategorizedCount = readModel.UncategorizedCount,
            PrimaryPillarKey = PrimaryPillarKeySelector.Select(pillars),
            LatestSnapshotCreatedUtc = readModel.LatestSnapshotCreatedUtc,
            IsDegraded = false,
        };
    }

    private PillarPosture BuildPillarPosture(
        ArchitecturePillarCatalogEntry catalogEntry,
        IReadOnlyDictionary<string, PillarFindingAggregate> aggregatesByPillar,
        ArchitecturePostureReadModel readModel,
        bool packAssignmentsAvailable)
    {
        aggregatesByPillar.TryGetValue(catalogEntry.PillarKey, out PillarFindingAggregate? aggregate);

        PillarFindingAggregate findingCounts = aggregate ?? new PillarFindingAggregate
        {
            PillarKey = catalogEntry.PillarKey,
        };

        List<PillarPackAssignment> pillarAssignments = readModel.PackAssignments
            .Where(assignment => string.Equals(assignment.PillarKey, catalogEntry.PillarKey, StringComparison.Ordinal))
            .ToList();

        ExaminationStateResolution examination = _examinationStateResolver.Resolve(
            catalogEntry.PillarKey,
            readModel.PackAssignments,
            readModel.LatestSnapshotCreatedUtc,
            readModel.UncategorizedCount,
            packAssignmentsAvailable);

        return new PillarPosture
        {
            PillarKey = catalogEntry.PillarKey,
            DisplayName = catalogEntry.DisplayName,
            DisplayOrder = catalogEntry.DisplayOrder,
            FindingCounts = findingCounts,
            Examination = examination,
            PackAssignments = pillarAssignments,
        };
    }

    private static ArchitecturePostureSummary BuildDegradedSummary()
    {
        List<PillarPosture> pillars = ArchitecturePillarCatalog.All
            .Select(catalogEntry => new PillarPosture
            {
                PillarKey = catalogEntry.PillarKey,
                DisplayName = catalogEntry.DisplayName,
                DisplayOrder = catalogEntry.DisplayOrder,
                FindingCounts = new PillarFindingAggregate { PillarKey = catalogEntry.PillarKey },
                Examination = new ExaminationStateResolution
                {
                    State = PillarExaminationState.Unavailable,
                    ReasonText = ReadFailureReason,
                },
                PackAssignments = [],
            })
            .ToList();

        return new ArchitecturePostureSummary
        {
            Pillars = pillars,
            ReviewIntegrity = new ReviewIntegrityAggregate(),
            UncategorizedCount = 0,
            PrimaryPillarKey = null,
            LatestSnapshotCreatedUtc = null,
            IsDegraded = true,
        };
    }
}
