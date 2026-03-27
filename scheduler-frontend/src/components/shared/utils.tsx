export function mapDictToKeyValue<T extends object>(obj: T) {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}
