export interface CursorPaginatedResult<T> {
  result?: T;
  cursor?: string; // Cursor to request next page of results
}

