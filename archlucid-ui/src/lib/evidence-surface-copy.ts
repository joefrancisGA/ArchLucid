export type EvidenceSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type EvidenceSourceLinkWithWhen = EvidenceSourceLink & {
  readonly when: string;
};

export type EvidenceAdminSourceLink = EvidenceSourceLink & {
  readonly adminOnly?: boolean;
};

export type EvidenceDiligenceSourceLink = EvidenceSourceLink & {
  readonly evidences: string;
  readonly access: string;
};

export type EvidenceSurfaceCopy = {
  readonly canonicalPath: string;
  readonly claimDiscipline: string;
  readonly sourcesIntro?: string;
  readonly sources?: readonly EvidenceSourceLink[];
};
