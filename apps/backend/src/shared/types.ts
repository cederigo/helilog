export interface PaginationParams {
  page: number
  limit: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
