export type EvidenceSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type EvidenceSurfaceCopy = {
  readonly canonicalPath: string;
  readonly claimDiscipline: string;
  readonly sourcesIntro?: string;
  readonly sources?: readonly EvidenceSourceLink[];
};
