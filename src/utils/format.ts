export function formatMoney(value: string | number): string {
  const asNumber = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(asNumber)) {
    return String(value)
  }
  return asNumber.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatInvoiceDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function displayNullable(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return 'Not provided'
  }
  return value
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
