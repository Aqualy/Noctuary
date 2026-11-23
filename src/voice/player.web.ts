// The web version is only used for testing: the Moon speaks silently.
export function hush() {}

export async function play(): Promise<void> {
  throw new Error('no sound on the web');
}
