const firstCap = /(.)([A-Z][a-z]+)/;
const allCap = /([a-z0-9])([A-Z])/;

export const toSnake = (name: string) => name.replace(firstCap, '$1_$2').replace(allCap, '$1_$2').toLowerCase();
export const toCamel = (name: string) => name.replace(/_([a-z])/g, (_, x) => x.toUpperCase());

export function snakeify<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => snakeify(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [toSnake(key), snakeify(val)]),
    ) as T;
  }
  return value;
}

export function camelize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelize(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [toCamel(key), camelize(val)]),
    ) as T;
  }
  return value;
}
