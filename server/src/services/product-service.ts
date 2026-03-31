import products from '../data/products.json'

export const productService = {
  getProducts() {
    return products
  },

  getProductById(productId: string) {
    return products.find((item) => item.id === productId)
  }
}
