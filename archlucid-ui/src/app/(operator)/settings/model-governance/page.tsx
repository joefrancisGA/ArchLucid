import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";

/** Admin workspace model governance: default execution profile, alias registry, and profile mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <div className="w-full max-w-4xl space-y-6 p-6" data-testid="model-governance-settings-page">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-al-text-primary">AI and model governance</h1>
        <p className="mt-1 text-sm text-al-text-secondary">
          Manage the workspace default execution profile and review governed model aliases used on reviews.
        </p>
      </div>
      <ModelGovernanceSettingsCard />
    </div>
  );
}
