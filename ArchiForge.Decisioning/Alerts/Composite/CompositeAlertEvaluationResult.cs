using ArchiForge.Decisioning.Alerts;

namespace ArchiForge.Decisioning.Alerts.Composite;

public sealed record CompositeAlertEvaluationResult(
    IReadOnlyList<AlertRecord> Created,
    int SuppressedMatchCount);
