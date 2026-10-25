export type ProductsListNavigationState = {
  productsListSearch: string
}

export function isProductsListNavigationState(
  value: unknown,
): value is ProductsListNavigationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'productsListSearch' in value &&
    typeof (value as { productsListSearch: unknown }).productsListSearch === 'string'
  )
}

export function createProductsListNavigationState(
  search: string,
): ProductsListNavigationState {
  return { productsListSearch: search }
}

export function getProductsListPath(state: unknown): string {
  if (isProductsListNavigationState(state)) {
    return `/products${state.productsListSearch}`
  }
  return '/products'
}
