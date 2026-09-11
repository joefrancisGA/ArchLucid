export type ArchitectureWorkLeaseSnapshot = {
  readonly holderUserId: string;
  readonly holderActorOid: string;
  readonly expiresUtc: string;
  readonly heldByCaller: boolean;
};

export type ArchitectureWorkLeaseResponse = ArchitectureWorkLeaseSnapshot & {
  readonly draftId: string;
  readonly architectureId: string;
  readonly acquiredUtc: string;
};

export type ArchitectureWorkLeaseConflictResponse = {
  readonly draftId: string;
  readonly holderUserId: string;
  readonly holderActorOid: string;
  readonly expiresUtc: string;
};
