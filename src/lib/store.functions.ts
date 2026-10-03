import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';

const emailSchema = z.string().trim().email().max(255);
const itemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) });
const orderSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().regex(/^01[0-9]{9}$/), address: z.string().trim().min(8).max(500), notes: z.string().trim().max(1000), paymentMethod: z.enum(['cod','instapay','vodafone']), items: z.array(itemSchema).min(1).max(50), proof: z.object({ base64: z.string().max(9500000), type: z.enum(['image/jpeg','image/png','image/webp']) }).optional() });

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('Store unavailable');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const getCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('products').select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) throw new Error('تعذر تحميل المنتجات');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return Promise.all((data ?? []).map(async product => {
    const image_urls = await Promise.all(product.image_urls.map(async path => {
      if (path.startsWith('https://')) return path;
      const { data: signed } = await supabaseAdmin.storage.from('product-images').createSignedUrl(path, 3600);
      return signed?.signedUrl ?? '';
    }));
    return { ...product, image_urls };
  }));
});

export const createOrder = createServerFn({ method: 'POST' }).inputValidator((input) => orderSchema.parse(input)).handler(async ({ data }) => {
  if (data.paymentMethod !== 'cod' && !data.proof) throw new Error('يرجى إرفاق صورة التحويل');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  let userId: string | null = null;
  const { getRequestHeader } = await import('@tanstack/react-start/server');
  const authorization = getRequestHeader('authorization');
  if (authorization) {
    const bearer = authorization.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) throw new Error('جلسة الحساب غير صالحة');
    const { data: auth, error } = await supabaseAdmin.auth.getUser(bearer);
    if (error || !auth.user) throw new Error('جلسة الحساب غير صالحة');
    userId = auth.user.id;
  }
  const quantities = new Map<string, number>();
  data.items.forEach(item => quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity));
  const ids = [...quantities.keys()];
  const { data: products, error: productsError } = await supabaseAdmin.from('products').select('*').in('id', ids).eq('active', true);
  if (productsError || !products || products.length !== ids.length) throw new Error('بعض المنتجات لم تعد متاحة');
  const now = Date.now();
  const items = products.map(product => {
    const quantity = quantities.get(product.id) ?? 0;
    if (quantity > product.stock) throw new Error(`الكمية غير متاحة: ${product.name}`);
    const price = product.discount_until && new Date(product.discount_until).getTime() > now ? Math.max(0, product.price - product.discount_amount) : product.price;
    return { product_id: product.id, product_name: product.name, quantity, unit_price: price };
  });
  let proofPath: string | null = null;
  if (data.proof) {
    const bytes = Uint8Array.from(atob(data.proof.base64), c => c.charCodeAt(0));
    if (bytes.length > 5_000_000) throw new Error('صورة التحويل كبيرة جداً');
    proofPath = `${crypto.randomUUID()}.${data.proof.type.split('/')[1]}`;
    const { error: uploadError } = await supabaseAdmin.storage.from('payment-proofs').upload(proofPath, bytes, { contentType: data.proof.type });
    if (uploadError) throw new Error('تعذر رفع إثبات التحويل');
  }
  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const { data: order, error } = await supabaseAdmin.from('orders').insert({ user_id: userId, customer_name: data.name, phone: data.phone, address: data.address, notes: data.notes, payment_method: data.paymentMethod, payment_proof_path: proofPath, total }).select('id').single();
  if (error || !order) throw new Error('تعذر تسجيل الطلب');
  const { error: itemError } = await supabaseAdmin.from('order_items').insert(items.map(item => ({ ...item, order_id: order.id })));
  if (itemError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw new Error('تعذر حفظ تفاصيل الطلب');
  }
  return { id: order.id, total };
});

export const getAdminData = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin');
  if (!allowed) throw new Error('غير مصرح لك بدخول لوحة الإدارة');
  const [products, orders, admins] = await Promise.all([
    context.supabase.from('products').select('*').order('created_at', { ascending: false }),
    context.supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
    context.supabase.from('admin_emails').select('*').order('created_at', { ascending: false }),
  ]);
  if (products.error || orders.error || admins.error) throw new Error('تعذر تحميل بيانات الإدارة');
  return { products: products.data ?? [], orders: orders.data ?? [], admins: admins.data ?? [] };
});

const productSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2).max(200), category: z.string().min(2).max(100), subcategory: z.string().max(100).nullable(), card_description: z.string().max(300), description: z.string().max(5000), image_urls: z.array(z.string().max(1000)).max(8), price: z.number().min(0).max(1000000), discount_amount: z.number().min(0).max(1000000), discount_until: z.string().nullable(), stock: z.number().int().min(0), featured: z.boolean(), active: z.boolean() }).refine(p => p.discount_amount <= p.price, 'الخصم لا يمكن أن يتجاوز السعر');
export const saveProduct = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => productSchema.parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin');
  if (!allowed) throw new Error('غير مصرح');
  const { id, ...fields } = data;
  const result = id ? await context.supabase.from('products').update(fields).eq('id', id).select().single() : await context.supabase.from('products').insert(fields).select().single();
  if (result.error) throw new Error('تعذر حفظ المنتج');
  return result.data;
});
export const removeProduct = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin'); if (!allowed) throw new Error('غير مصرح');
  const { error } = await context.supabase.from('products').update({ active: false }).eq('id', data.id);
  if (error) throw new Error('تعذر إخفاء المنتج'); return { ok: true };
});
export const updateOrderStatus = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ id: z.string().uuid(), status: z.enum(['new','confirmed','completed','cancelled']) }).parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin'); if (!allowed) throw new Error('غير مصرح');
  const { error } = await context.supabase.from('orders').update({ status: data.status }).eq('id', data.id);
  if (error) throw new Error(error.message.includes('Insufficient stock') ? 'المخزون غير كافٍ لإكمال الطلب' : 'تعذر تحديث الطلب'); return { ok: true };
});
export const addAdminEmail = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ email: emailSchema }).parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin'); if (!allowed) throw new Error('غير مصرح');
  const { error } = await context.supabase.from('admin_emails').insert({ email: data.email.toLowerCase() });
  if (error) throw new Error('تعذر إضافة البريد، ربما هو موجود بالفعل'); return { ok: true };
});
export const removeAdminEmail = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ email: emailSchema }).parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin'); if (!allowed) throw new Error('غير مصرح');
  const { error } = await context.supabase.from('admin_emails').delete().eq('email', data.email);
  if (error) throw new Error('تعذر حذف البريد'); return { ok: true };
});
export const getProofUrl = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ path: z.string().min(1).max(500) }).parse(input)).handler(async ({ context, data }) => {
  const { data: allowed } = await context.supabase.rpc('is_store_admin'); if (!allowed) throw new Error('غير مصرح');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: signed, error } = await supabaseAdmin.storage.from('payment-proofs').createSignedUrl(data.path, 300);
  if (error || !signed) throw new Error('تعذر عرض الإيصال'); return { url: signed.signedUrl };
});
