import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/store.functions';
import { money, priceOf, useStore } from '@/components/store/store-context';
import { PageTitle, StoreShell } from '@/components/store/store-ui';
const formSchema = z.object({ name: z.string().trim().min(2,'اكتب الاسم بالكامل'), phone: z.string().trim().regex(/^01[0-9]{9}$/,'اكتب رقم موبايل مصري صحيح'), address: z.string().trim().min(8,'اكتب العنوان بالتفصيل'), notes: z.string().max(1000) });
export const Route = createFileRoute('/checkout')({ head: () => ({ meta: [{ title: 'إتمام الطلب | برستيج الأقصر' }, { name: 'description', content: 'أكمل بيانات الشحن واختر الدفع عند الاستلام أو إنستا باي أو فودافون كاش.' }, { property: 'og:title', content: 'إتمام الطلب | برستيج الأقصر' }, { property: 'og:description', content: 'أكمل طلبك واختر طريقة الدفع المناسبة.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: Checkout });
function Checkout() {
  const { products, cart, clearCart } = useStore();
  const orderFn = useServerFn(createOrder);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cod'|'instapay'|'vodafone'>('cod');
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const lines = cart.map(line => ({ line, product: products.find(p => p.id === line.id) })).filter(x => x.product);
  const total = lines.reduce((sum, x) => sum + priceOf(x.product!) * x.line.quantity, 0);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    const result = formSchema.safeParse(form);
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'تأكد من البيانات'); return; }
    if (!lines.length) { setError('السلة فارغة'); return; }
    if (paymentMethod !== 'cod' && !proof) { setError('ارفع صورة إيصال التحويل لإتمام الدفع الإلكتروني'); return; }
    if (proof && (proof.size > 5_000_000 || !['image/jpeg','image/png','image/webp'].includes(proof.type))) { setError('ارفع صورة JPG أو PNG أو WEBP بحجم أقل من ٥ ميجابايت'); return; }
    setBusy(true);
    try {
      let encoded: { base64: string; type: 'image/jpeg'|'image/png'|'image/webp' } | undefined;
      if (proof) { const buffer = await proof.arrayBuffer(); const bytes = new Uint8Array(buffer); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); encoded = { base64: btoa(binary), type: proof.type as 'image/jpeg'|'image/png'|'image/webp' }; }
      const response = await orderFn({ data: { ...result.data, paymentMethod, items: lines.map(x => ({ productId: x.line.id, quantity: x.line.quantity })), proof: encoded } });
      setSuccess(response.id); clearCart();
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب، حاول مرة أخرى'); } finally { setBusy(false); }
  }
   return <StoreShell><main className="mx-auto min-h-[55vh] max-w-7xl px-6 py-12">{success ? <div className="mx-auto max-w-lg py-20 text-center"><CheckCircle2 className="mx-auto size-16 text-brand-gold" /><h1 className="mt-6 text-3xl font-bold">تم استلام طلبك بنجاح</h1><p className="mt-4 text-muted-foreground">رقم الطلب: <span dir="ltr">{success.slice(0,8).toUpperCase()}</span></p><p className="mt-2 text-sm text-muted-foreground">سنتواصل معك لتأكيد الطلب وتكلفة الشحن.</p><Button asChild className="mt-8"><Link to="/">العودة للرئيسية</Link></Button></div> : <><PageTitle eyebrow="الخطوة الأخيرة" title="إتمام الطلب" /><div className="grid gap-10 lg:grid-cols-[1fr_350px]"><form id="checkout" onSubmit={submit} className="space-y-8"><div><h2 className="mb-5 text-xl font-bold">بيانات التوصيل</h2><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm">الاسم بالكامل<input required maxLength={100} className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label className="space-y-2 text-sm">رقم الموبايل<input required inputMode="tel" maxLength={11} className="field" placeholder="01XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label className="space-y-2 text-sm sm:col-span-2">العنوان بالتفصيل<textarea required className="field min-h-24" value={form.address} maxLength={500} onChange={e => setForm({ ...form, address: e.target.value })} /></label><label className="space-y-2 text-sm sm:col-span-2">ملاحظات للطلب (اختياري)<textarea className="field min-h-20" value={form.notes} maxLength={1000} onChange={e => setForm({ ...form, notes: e.target.value })} /></label></div></div><div><h2 className="mb-5 text-xl font-bold">طريقة الدفع</h2><div className="space-y-3">{([['cod','كاش عند الاستلام'],['instapay','إنستا باي'],['vodafone','فودافون كاش']] as const).map(([key,label]) => <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${paymentMethod === key ? 'border-brand-gold bg-secondary/40' : 'border-border'}`}><input type="radio" name="payment" checked={paymentMethod === key} onChange={() => { setPaymentMethod(key); setProof(null); }} className="accent-primary" /><span className="font-medium">{label}</span></label>)}</div>{paymentMethod !== 'cod' && <div className="mt-5 border border-border bg-secondary/30 p-5"><p className="text-sm leading-7">حوّل المبلغ إلى رقم <strong dir="ltr" className="inline-block">01063621727</strong> عبر {paymentMethod === 'instapay' ? 'إنستا باي' : 'فودافون كاش'}. صورة إيصال التحويل مطلوبة لإتمام الطلب.</p><label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-bold text-primary"><Upload className="size-5" />{proof ? proof.name : 'ارفع صورة إيصال التحويل (مطلوب)'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => setProof(e.target.files?.[0] ?? null)} /></label></div>}</div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form><aside className="h-fit border border-border p-6"><h2 className="text-lg font-bold">ملخص الطلب</h2>{lines.map(({line,product}) => product && <div key={line.id} className="flex justify-between gap-4 border-b border-border py-4 text-sm"><span>{product.name} × {line.quantity}</span><span className="shrink-0">{money(priceOf(product) * line.quantity)}</span></div>)}<div className="mt-5 flex justify-between text-lg font-bold"><span>الإجمالي</span><span>{money(total)}</span></div><p className="mt-4 text-xs leading-6 text-muted-foreground">الشحن غير مشمول في الإجمالي؛ سنبلغك بتكلفته بعد مراجعة عنوانك.</p><Button type="submit" form="checkout" className="mt-6 w-full" size="lg" disabled={busy || !lines.length}>{busy ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}</Button></aside></div></>}</main></StoreShell>;
}
