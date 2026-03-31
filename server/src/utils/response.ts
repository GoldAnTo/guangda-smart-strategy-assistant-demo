export function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function successResponse(data: Record<string, unknown>, requestId: string) {
  return {
    success: true,
    requestId,
    data,
  }
}

export function errorResponse(message: string, requestId: string, extra?: Record<string, unknown>) {
  return {
    success: false,
    requestId,
    code: 1,
    message,
    ...(extra || {}),
  }
}
