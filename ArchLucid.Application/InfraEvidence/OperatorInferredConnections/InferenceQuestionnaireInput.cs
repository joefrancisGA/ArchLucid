using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

public sealed class InferenceQuestionnaireInput
{
    public AzureInventorySnapshotDetailReadModel Snapshot
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AzureInventoryAppSettingHostRow> AppSettingHosts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> CompletenessWarnings
    {
        get;
        init;
    } = [];
}
