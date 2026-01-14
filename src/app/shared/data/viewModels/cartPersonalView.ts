export interface CartPersonalView {
  id?: number;
  items?: CartDetailPersonalView[];
  totalPrice: number;
  userId: number | string;
}

export interface CartDetailPersonalView {
  id: number;
  cartId?: number;
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
}