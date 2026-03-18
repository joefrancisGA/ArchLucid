using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.Decisioning.Services;

public class FindingsOrchestrator : IFindingsOrchestrator
{
    private readonly IEnumerable<IFindingEngine> _engines;
    private readonly IFindingsSnapshotRepository _repository;
    private readonly IFindingPayloadValidator _validator;

    public FindingsOrchestrator(
        IEnumerable<IFindingEngine> engines,
        IFindingsSnapshotRepository repository)
    {
        _engines = engines;
        _repository = repository;
        _validator = new NoOpFindingPayloadValidator();
    }

    public FindingsOrchestrator(
        IEnumerable<IFindingEngine> engines,
        IFindingsSnapshotRepository repository,
        IFindingPayloadValidator validator)
    {
        _engines = engines;
        _repository = repository;
        _validator = validator;
    }

    public async Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        var allFindings = new List<Finding>();

        foreach (var engine in _engines)
        {
            var findings = await engine.AnalyzeAsync(graphSnapshot, ct);
            foreach (var finding in findings)
            {
                if (string.IsNullOrWhiteSpace(finding.Category))
                {
                    finding.Category = engine.Category;
                }

                _validator.Validate(finding);

                if (!string.Equals(finding.Category, engine.Category, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Finding category '{finding.Category}' did not match engine category '{engine.Category}' for engine '{engine.EngineType}'.");
                }

                allFindings.Add(finding);
            }
        }

        var snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshot.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings = allFindings
        };

        await _repository.SaveAsync(snapshot, ct);

        return snapshot;
    }

    private sealed class NoOpFindingPayloadValidator : IFindingPayloadValidator
    {
        public void Validate(Finding finding)
        {
            // no-op
        }
    }
}

