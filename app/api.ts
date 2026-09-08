const BASE = process.env.API_URL;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const json = (await res.json()) as { success?: boolean; data?: T; message?: string };

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `GET ${path} failed`);
  }

  return json.data as T;
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { success?: boolean; data?: T; message?: string };

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `POST ${path} failed`);
  }

  return json.data as T;
}

export type CoffeeWeight = 250 | 500 | 1000;

export interface Coffee {
  _id: string;
  name: string;
  slug: string;
  country: string;
  region: string;
  variety: string;
  process: string;
  altitude: string;
  description: string;
  story: string;
  flavorNotes: string[];
  price: number;
  weights: CoffeeWeight[];
  image: string;
  gallery: string[];
  stock: number;
}

export interface CartItem {
  slug: string;
  name: string;
  weight: CoffeeWeight;
  quantity: number;
  price: number;
  country: string;
}

export interface CreateOrderPayload {
  items: Array<{ slug: string; weight: CoffeeWeight; quantity: number }>;
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    comment?: string;
  };
}

export interface Order {
  _id: string;
  totalPrice: number;
  status: string;
}

export interface CreateContactPayload {
  name: string;
  email: string;
  message: string;
}

export const getCoffees = () => get<Coffee[]>('/coffees');

export const getCoffeeBySlug = (slug: string) => get<Coffee>(`/coffees/${slug}`);

export const createOrder = (order: CreateOrderPayload) => post<Order>('/orders', order);

export const createContact = (contact: CreateContactPayload) => post('/contacts', contact);
