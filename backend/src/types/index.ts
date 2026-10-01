// C7: align with contract - username not email
export interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin';
}

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]> | unknown;
  };
}