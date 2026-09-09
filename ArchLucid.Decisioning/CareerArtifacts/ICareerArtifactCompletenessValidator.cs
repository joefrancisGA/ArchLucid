namespace ArchLucid.Decisioning.CareerArtifacts;

public interface ICareerArtifactCompletenessValidator
{
    CareerArtifactCompletenessResult Evaluate(CareerArtifactCompletenessInput input);
}
