export type IdentityProvidersFetchNote = {
  readonly message: string;
  readonly statusCode?: number;
};

export function formatIdentityProvidersFetchNote(note: IdentityProvidersFetchNote): string {
  if (note.statusCode !== undefined) {
    return `${note.message} (HTTP ${note.statusCode}).`;
  }

  return note.message;
}
