using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Posture;

public sealed class ExaminationStateResolution
{
    public PillarExaminationState State
    {
        get;
        init;
    }

    private string reasonText = string.Empty;

    public string ReasonText
    {
        get => reasonText;
        init => reasonText = ContractCollectionDefaults.CoalesceRequired(value);
    }
}
