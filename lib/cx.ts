/** Junta classes condicionalmente, ignorando valores falsy. */
export function clsx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
