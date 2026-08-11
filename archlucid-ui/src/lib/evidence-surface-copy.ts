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

/**
 * Widest link shape an orientation strip can render. Every narrower link type above is structurally
 * assignable to it, so per-surface copy modules keep their precise type and still pass type-check here.
 */
export type EvidenceOrientationLink = EvidenceSourceLink & {
  readonly when?: string;
  readonly adminOnly?: boolean;
};

export type EvidenceSurfaceCopy = {
  readonly canonicalPath: string;
  readonly claimDiscipline: string;
  readonly sourcesIntro?: string;
  readonly sources?: readonly EvidenceSourceLink[];
};
