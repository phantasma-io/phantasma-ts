/**
 * A value decoded from VM storage: a scalar, an array, or a struct.
 *
 * VM values are dynamically typed, so the wire carries the plain JSON value - a string, an array or
 * an object - and the shape itself says which of the three it is. Nothing is packed into a JSON
 * string.
 *
 * Scalars are always strings: chain numbers are big integers, and JSON numbers lose precision above
 * 2^53, so the node sends them as decimal strings; byte values arrive as hex.
 *
 * Narrow with the plain JavaScript checks - `typeof value === 'string'` for a scalar,
 * `Array.isArray(value)` for an array, otherwise a struct.
 */
export type VmValue = string | VmValue[] | { [field: string]: VmValue };
