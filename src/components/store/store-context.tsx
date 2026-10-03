import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCatalog } from '@/lib/store.functions';
import { supabase } from '@/integrations/supabase/client';

type Product = Awaited<ReturnType<typeof getCatalog>>[number];
type CartLine = { id: string; quantity: number };
type StoreContextValue = { products: Product[]; loading: boolean; cart: CartLine[]; favorites: string[]; addToCart: (id: string, quantity?: number) => void; setQuantity: (id: string, quantity: number) => void; toggleFavorite: (id: string) => void; clearCart: () => void; session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] };
const StoreContext = createContext<StoreContextValue | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: products = [], isPending: loading } = useQuery({ queryKey: ['catalog'], queryFn: () => getCatalog(), staleTime: 60000 });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [session, setSession] = useState<StoreContextValue['session']>(null);
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('prestige-cart') ?? '[]')); setFavorites(JSON.parse(localStorage.getItem('prestige-favorites') ?? '[]')); } catch { /* ignore stale storage */ }
    setStorageReady(true);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (storageReady) localStorage.setItem('prestige-cart', JSON.stringify(cart)); }, [cart, storageReady]);
  useEffect(() => { if (storageReady) localStorage.setItem('prestige-favorites', JSON.stringify(favorites)); }, [favorites, storageReady]);
  const addToCart = (id: string, quantity = 1) => setCart(previous => {
    const product = products.find(p => p.id === id);
    if (!product || product.stock < 1) return previous;
    const existing = previous.find(line => line.id === id);
    return existing ? previous.map(line => line.id === id ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) } : line) : [...previous, { id, quantity: Math.min(product.stock, quantity) }];
  });
  const setQuantity = (id: string, quantity: number) => setCart(previous => quantity <= 0 ? previous.filter(line => line.id !== id) : previous.map(line => line.id === id ? { ...line, quantity: Math.min(products.find(p => p.id === id)?.stock ?? quantity, quantity) } : line));
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  return <StoreContext.Provider value={{ products, loading, cart, favorites, addToCart, setQuantity, toggleFavorite, clearCart: () => setCart([]), session }}>{children}</StoreContext.Provider>;
}
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error('Store context missing'); return value; }
export type { Product };
export function priceOf(p: Product) { return p.discount_until && new Date(p.discount_until).getTime() > Date.now() ? Math.max(0, p.price - p.discount_amount) : p.price; }
export function discountOf(p: Product) { return p.price > 0 ? Math.round((1 - priceOf(p) / p.price) * 100) : 0; }
export const money = (amount: number) => `${Number(amount).toLocaleString('ar-EG')} ج.م`;
export const categories = [
  { name: 'عناية بالشعر', subs: ['صبغة','شامبو','بلسم','كريم شعر','جيل','زيت','سيروم','كريم فرد','حمام كريم'] },
  { name: 'عناية بالجسم', subs: ['شاور جيل','مرطب بشرة','مخمرية','ماسك بشرة','فازلين','كريم تفتيح','بودي سبلاش','لوف حمام'] },
  { name: 'مزيلات شعر', subs: ['كريم إزالة','سبراي إزالة','سويت','شمع','مناديل شمع','جهاز شمع'] },
  { name: 'عناية بالفم', subs: ['فرش أسنان','معجون أسنان','مضمضة','معطر فم'] },
  { name: 'عناية بالطفل', subs: ['حفاضات','ببرونات','سكاتات','برفان أطفال','شامبو','زيت','شاور جيل','بودرة تلك'] },
  { name: 'ورقيات', subs: ['حفاضات كبار','حفاضات أطفال','فوط نسائية','مناديل','مناديل مطبخ'] },
  { name: 'برفانات', subs: [] }, { name: 'سبريهات', subs: [] }, { name: 'ميك أب', subs: [] }, { name: 'مبيدات حشرية', subs: [] }, { name: 'معطرات جو', subs: [] },
  { name: 'متنوعات', subs: ['سشوار','ماكينة حلاقة','مكواة شعر','جهاز شمع'] },
];
