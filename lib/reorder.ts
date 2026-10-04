/**
 * Move `id` so it sits directly after `afterId`; `null` means the top.
 *
 * A move is described by its new neighbour rather than by a whole new list, so
 * a client whose list is out of date cannot undo someone else's reorder or
 * drop a row it has not seen yet. An unknown id leaves the list unchanged.
 */
export function moveAfter(
  current: string[],
  id: string,
  afterId: string | null,
): string[] {
  if (id === afterId || !current.includes(id)) return current;
  if (afterId !== null && !current.includes(afterId)) return current;
  const rest = current.filter((other) => other !== id);
  const at = afterId === null ? 0 : rest.indexOf(afterId) + 1;
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}
