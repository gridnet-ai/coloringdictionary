import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getCatalogProduct, type CatalogProduct } from '@/lib/catalog';

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  addItem: (slug: string, qty?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  items: { product: CatalogProduct; quantity: number; lineCents: number }[];
};

const STORAGE_KEY = 'cd-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l &&
        typeof l.slug === 'string' &&
        typeof l.quantity === 'number' &&
        l.quantity > 0 &&
        getCatalogProduct(l.slug),
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(loadLines());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  const value = useMemo<CartContextValue>(() => {
    const items = lines
      .map((line) => {
        const product = getCatalogProduct(line.slug);
        if (!product) return null;
        return {
          product,
          quantity: line.quantity,
          lineCents: product.priceCents * line.quantity,
        };
      })
      .filter(Boolean) as CartContextValue['items'];

    return {
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: items.reduce((n, i) => n + i.lineCents, 0),
      items,
      addItem(slug, qty = 1) {
        if (!getCatalogProduct(slug)) return;
        setLines((prev) => {
          const existing = prev.find((l) => l.slug === slug);
          if (existing) {
            return prev.map((l) =>
              l.slug === slug
                ? { ...l, quantity: Math.min(20, l.quantity + qty) }
                : l,
            );
          }
          return [...prev, { slug, quantity: Math.min(20, qty) }];
        });
      },
      setQuantity(slug, quantity) {
        const q = Math.floor(quantity);
        if (q <= 0) {
          setLines((prev) => prev.filter((l) => l.slug !== slug));
          return;
        }
        setLines((prev) =>
          prev.map((l) =>
            l.slug === slug ? { ...l, quantity: Math.min(20, q) } : l,
          ),
        );
      },
      removeItem(slug) {
        setLines((prev) => prev.filter((l) => l.slug !== slug));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
