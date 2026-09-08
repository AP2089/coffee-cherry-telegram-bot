import { Context, SessionFlavor } from 'grammy';
import type { CartItem, CoffeeWeight } from '../api.js';

export type Step =
  | 'order:name'
  | 'order:email'
  | 'order:phone'
  | 'order:city'
  | 'order:address'
  | 'order:comment'
  | 'contact:name'
  | 'contact:email'
  | 'contact:message'
  | 'ai:chat'
  | null;

export interface SessionData {
  step: Step;
  cart: CartItem[];
  pendingWeight?: { slug: string; weight: CoffeeWeight };
  order: Partial<{
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    comment: string;
  }>;
  contact: Partial<{
    name: string;
    email: string;
    message: string;
  }>;
}

export type Ctx = Context & SessionFlavor<SessionData>;
