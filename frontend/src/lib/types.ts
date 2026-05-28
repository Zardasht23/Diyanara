export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  category: string;
  stock: number;
  weightGrams: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCostCents: number;
  totalCents: number;
  currency: string;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingZip?: string | null;
  shippingCountry?: string | null;
  trackingNumber?: string | null;
  labelUrl?: string | null;
  carrier?: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: { id: string; email: string; name: string | null };
}

export interface ShippingAddress {
  name: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  country?: string;
}
