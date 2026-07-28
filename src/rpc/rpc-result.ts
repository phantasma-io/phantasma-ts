// string[] is the native-array parameter form batch endpoints take (e.g. getAccountInfos
// addresses); the node binds JSON arrays element-wise, never comma-joined strings.
export type JsonRpcParam = string | number | boolean | null | undefined | string[];

export interface JsonRpcErrorObject {
  code?: number;
  message?: string;
  data?: unknown;
}

export interface JsonRpcSuccessResponse<T> {
  jsonrpc?: string;
  id?: string | number | null;
  result: T;
}

export interface JsonRpcErrorResponse {
  jsonrpc?: string;
  id?: string | number | null;
  error: string | JsonRpcErrorObject;
}

export type JsonRpcResponse<T> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

export interface RpcErrorResult {
  error: string;
  code?: number;
  data?: unknown;
  status?: number;
  statusText?: string;
}

export type RpcResult<T> = T | RpcErrorResult;

export function isRpcErrorResult(value: unknown): value is RpcErrorResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error?: unknown }).error === 'string' &&
    (value as { error: string }).error.length > 0
  );
}

export function getRpcErrorMessage(value: unknown, fallback = 'RPC request failed'): string {
  if (isRpcErrorResult(value)) {
    return value.error;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as { message?: unknown; error?: unknown };
    if (typeof record.message === 'string' && record.message.length > 0) {
      return record.message;
    }
    if (typeof record.error === 'string' && record.error.length > 0) {
      return record.error;
    }
  }

  return fallback;
}

export function normalizeRpcError(error: unknown, fallback = 'RPC request failed'): RpcErrorResult {
  const result: RpcErrorResult = {
    error: getRpcErrorMessage(error, fallback),
  };

  if (typeof error === 'object' && error !== null) {
    const record = error as { code?: unknown; data?: unknown };
    if (typeof record.code === 'number') {
      result.code = record.code;
    }
    if ('data' in record) {
      result.data = record.data;
    }
  }

  return result;
}

export function unwrapRpcResult<T>(result: RpcResult<T>): T {
  if (isRpcErrorResult(result)) {
    throw new Error(result.error);
  }

  return result;
}
