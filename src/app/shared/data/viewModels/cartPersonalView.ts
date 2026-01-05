export interface CartPersonalView {
  id?: number;
  items?: CartDetailPersonalView[];
  totalPrice: number;
  userId: number;
}
export interface CartDetailPersonalView {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  price: number;
}