export type ActorKind = "Human" | "Machine" | "Both";
export type TrustOrigin = "Internal" | "External" | "PublicAnonymous";
export type InteractionContract = "Sync" | "AsyncBatch" | "Event" | "Streaming";
export type ActorOrigin = "Asserted" | "Inferred";

export type ActorDescriptor = {
  label?: string;
  kind: ActorKind;
  trustOrigin: TrustOrigin;
  contract: InteractionContract;
  origin: ActorOrigin;
  confidence: number;
};

export type ActorSet = {
  actors: ActorDescriptor[];
};
