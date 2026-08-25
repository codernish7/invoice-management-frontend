import axios from 'axios'

type ApiErrorBody = {
  message?: string
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as ApiErrorBody).message
      if (typeof message === 'string' && message.trim() !== '') {
        return message
      }
    }
    if (typeof data === 'string' && data.trim() !== '') {
      return data
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}
