import demoManifest from "../../../fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json";

export type DemoWorkspaceFixtureWorkspace = {
  readonly code: string;
  readonly runId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly expectedCommittedFindingCount: number;
  readonly minimumEvidenceBasisTiles?: number;
  readonly seedSyntheticEvidenceObjectCount: number;
};

export type DemoWorkspacesFixtureManifest = {
  readonly fixturePackageId: string;
  readonly fixturePackageVersion: string;
  readonly defaultTenantId: string;
  readonly workspaceA: DemoWorkspaceFixtureWorkspace;
  readonly workspaceB: DemoWorkspaceFixtureWorkspace;
};

export const demoWorkspacesFixtureManifest = demoManifest as DemoWorkspacesFixtureManifest;
