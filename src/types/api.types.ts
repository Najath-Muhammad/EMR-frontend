export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
  meta: ApiMeta;
}
