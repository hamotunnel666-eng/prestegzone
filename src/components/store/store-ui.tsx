import { Link, useNavigate } from '@tanstack/react-router';
import { Heart, ShoppingBag, Search, Menu, X, UserRound, ChevronDown, ArrowLeft, PackageOpen, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/prestige-luxor-logo.png.asset.json';
import hair from '@/assets/category-hair.jpg';
import body from '@/assets/category-body.jpg';
import beauty from '@/assets/category-beauty.jpg';
import baby from '@/assets/category-baby.jpg';
import removal from '@/assets/category-removal.jpg';
import oral from '@/assets/category-oral.jpg';
import perfume from '@/assets/category-perfume.jpg';
import paper from '@/assets/category-paper.jpg';
import spray from '@/assets/category-spray.jpg';
import insect from '@/assets/category-insect.jpg';
import air from '@/assets/category-air.jpg';
import devices from '@/assets/category-devices.jpg';
import { categories, discountOf, money, priceOf, useStore, type Product } from './store-context';

export const categoryImages: Record<string, string> = { 'عناية بالشعر': hair, 'عناية بالجسم': body, 'عناية بالطفل': baby, 'ميك أب': beauty, 'برفانات': perfume, 'سبريهات': spray, 'مزيلات شعر': removal, 'عناية بالفم': oral, 'ورقيات': paper, 'مبيدات حشرية': insect, 'معطرات جو': air, 'متنوعات': devices };
export function StoreShell({ children }: { children: ReactNode }) {
  const { cart, favorites, session } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const [all, setAll] = useState(false);
  return <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">كل احتياجات العناية والجمال في مكان واحد <span className="mx-3 text-brand-gold">✦</span> أسعار واضحة وتسوق بسهولة</div>
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-8 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</Button>
        <Link to="/" className="shrink-0" aria-label="برستيج الأقصر - الرئيسية"><img src={logo.url} alt="برستيج الأقصر" className="h-12 w-36 object-contain object-right sm:h-16 sm:w-48" /></Link>
        <form className="mx-auto hidden w-full max-w-xl items-center rounded-md border border-border bg-secondary/40 focus-within:border-brand-gold md:flex" onSubmit={e => { e.preventDefault(); navigate({ to: '/shop', search: { q: search, category: '', favorites: false } }); }}><Search className="mr-4 size-5 text-muted-foreground" /><input className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" placeholder="بتدور على إيه؟" value={search} onChange={e => setSearch(e.target.value)} /><Button type="submit" className="m-1 h-9">ابحث</Button></form>
        <div className="mr-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link to="/shop" search={{ q: '', category: '', favorites: true }} className="relative rounded-md p-2 hover:bg-secondary" aria-label="المفضلة"><Heart className="size-5" /><span className="absolute -top-1 -left-1 text-[10px] text-brand-gold">{favorites.length || ''}</span></Link>
          <Link to="/cart" className="relative rounded-md p-2 hover:bg-secondary" aria-label="سلة التسوق"><ShoppingBag className="size-5" />{cart.length > 0 && <span className="absolute -top-1 -left-1 grid size-4 place-items-center rounded-full bg-brand-gold text-[10px] text-primary">{cart.reduce((n, i) => n + i.quantity, 0)}</span>}</Link>
          <Link to={session ? '/account' : '/auth'} className="rounded-md p-2 hover:bg-secondary" aria-label="حسابي"><UserRound className="size-5" /></Link>
        </div>
      </div>
      <form className="flex gap-2 border-t border-border px-4 py-2 md:hidden" onSubmit={e => { e.preventDefault(); navigate({ to: '/shop', search: { q: search, category: '', favorites: false } }); }}><input className="h-9 min-w-0 flex-1 rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none" placeholder="بتدور على إيه؟" value={search} onChange={e => setSearch(e.target.value)} /><Button type="submit" size="icon" aria-label="ابحث"><Search /></Button></form>
    </header>
    <nav className="border-b border-border bg-background"><div className="relative mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 text-sm lg:px-6"><Button variant="ghost" className="shrink-0 gap-2 font-bold" onClick={() => setAll(!all)}>كل الفئات <ChevronDown className="size-4" /></Button><Link to="/shop" search={{ q: '', category: '', favorites: false }} className="shrink-0 hover:text-brand-gold">كل المنتجات</Link>{categories.slice(0,7).map(c => <Link key={c.name} to="/shop" search={{ q: '', category: c.name, favorites: false }} className="shrink-0 hover:text-brand-gold">{c.name}</Link>)}</div>{(all || menu) && <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 border-t border-border p-4 sm:grid-cols-3 lg:grid-cols-6">{categories.map(c => <Link key={c.name} to="/shop" search={{ q: '', category: c.name, favorites: false }} onClick={() => { setAll(false); setMenu(false); }} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">{c.name}</Link>)}</div>}</nav>
    {children}
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3"><div><h3 className="text-xl font-bold">برستيج الأقصر</h3><p className="mt-3 text-sm text-primary-foreground/70">اختيارات للعناية والجمال، من قلب الأقصر.</p></div><div><h4 className="mb-4 font-bold">تسوق</h4><div className="grid gap-2 text-sm text-primary-foreground/70"><Link to="/shop" search={{ q: '', category: '', favorites: false }}>كل المنتجات</Link><Link to="/cart">سلة التسوق</Link></div></div><div><h4 className="mb-4 font-bold">الدفع والتواصل</h4><p className="text-sm leading-7 text-primary-foreground/70">الدفع عند الاستلام أو إنستا باي أو فودافون كاش<br />01063621727<br />تظهر تفاصيل التوصيل قبل تأكيد الطلب.</p></div></div><div className="border-t border-primary-foreground/20 py-4 text-center text-xs text-primary-foreground/60">© برستيج الأقصر — PRESTIGE LUXOR</div></footer>
  </div>;
}
export function ProductCard({ product }: { product: Product }) {
  const { favorites, toggleFavorite, addToCart } = useStore();
  const discounted = discountOf(product);
  return <article className="group min-w-0 overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-md"><div className="relative aspect-square overflow-hidden bg-secondary"><Link to="/product/$id" params={{ id: product.id }} className="block h-full">{product.image_urls[0] ? <img src={product.image_urls[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><PackageOpen className="size-12 text-muted-foreground/40" /></div>}</Link>{discounted > 0 && <span className="absolute top-3 right-3 rounded-sm bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">خصم {discounted}٪</span>}<Button variant="outline" size="icon" className="absolute top-3 left-3 size-8 bg-background" aria-label={favorites.includes(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'} onClick={() => toggleFavorite(product.id)}><Heart className={favorites.includes(product.id) ? 'fill-brand-gold text-brand-gold' : ''} /></Button></div><div className="space-y-2 p-3 sm:p-4"><p className="text-xs text-brand-gold">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}</p><Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 min-h-10 text-sm font-bold leading-5 hover:text-brand-gold">{product.name}</Link><p className="line-clamp-2 min-h-9 text-xs leading-5 text-muted-foreground">{product.card_description || 'تفاصيل المنتج متاحة في صفحة المنتج'}</p><div className="flex flex-wrap items-baseline gap-2"><strong className="text-base text-primary">{money(priceOf(product))}</strong>{discounted > 0 && <del className="text-xs text-muted-foreground">{money(product.price)}</del>}</div><Button className="w-full" disabled={product.stock === 0} onClick={() => addToCart(product.id)}><Plus className="size-4" />{product.stock ? 'أضف للسلة' : 'نفدت الكمية'}</Button></div></article>;
}
export function PageTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) { return <div className="mb-8"><p className="mb-2 text-xs font-bold text-brand-gold">{eyebrow}</p><h1 className="text-3xl font-bold md:text-4xl">{title}</h1>{detail && <p className="mt-3 text-sm text-muted-foreground">{detail}</p>}</div>; }
export function BackShop() { return <Link to="/shop" search={{ q: '', category: '', favorites: false }} className="inline-flex items-center gap-2 text-sm text-primary hover:text-brand-gold">متابعة التسوق <ArrowLeft className="size-4" /></Link>; }
