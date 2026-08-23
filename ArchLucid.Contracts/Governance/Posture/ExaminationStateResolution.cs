namespace ArchLucid.Contracts.Governance.Posture;

public sealed class ExaminationStateResolution
{
    public PillarExaminationState State
    {
        get;
        init;
    }

    public string ReasonText
    {
        get;
        init;
    } = null!;
}
