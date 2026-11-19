import { useEffect } from 'react';
import 'shepherd.js/dist/css/shepherd.css';

const DONE_KEY = 'prestige-tour-done';

// First-visit guided tour. Shepherd is imported only in the browser after hydration.
export function OnboardingTour() {
  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) return;
    let tour: { start: () => void; cancel: () => void } | null = null;
    const timer = window.setTimeout(async () => {
      const { default: Shepherd } = await import('shepherd.js');
      const visible = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${sel}"]`)).find(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
      const t = new Shepherd.Tour({ useModalOverlay: true, defaultStepOptions: { cancelIcon: { enabled: true }, classes: 'prestige-tour', scrollTo: { behavior: 'smooth', block: 'center' } } });
      const finish = () => localStorage.setItem(DONE_KEY, '1');
      t.on('complete', finish); t.on('cancel', finish);
      const raw = [
        { id: 'welcome', title: 'أهلاً بيك في برستيج زون 👋', text: 'خلينا ناخد لفة سريعة نعرّفك فيها إزاي تطلب في أقل من دقيقة.' },
        { id: 'search', el: 'search', title: 'دوّر على أي منتج', text: 'اكتب اسم المنتج اللي محتاجه هنا واضغط بحث.' },
        { id: 'categories', el: 'categories', title: 'تصفح الأقسام', text: 'من هنا تفتح كل الأقسام: شعر، جسم، طفل، ورقيات، برفانات وغيرهم.' },
        { id: 'add', el: 'add', title: 'أضف للسلة', text: 'اضغط زرار + على أي منتج عشان يتضاف للسلة فوراً.' },
        { id: 'cart', el: 'cart', title: 'سلة التسوق', text: 'هنا هتلاقي كل المنتجات اللي اخترتها، وتقدر تغيّر الكميات وتكمل الطلب.' },
        { id: 'checkout', title: 'إزاي تكمل طلبك؟', text: 'من السلة اضغط «إتمام الطلب» ← اكتب اسمك وتليفونك ← اختار منطقتك عشان يتحسب التوصيل ← حدد موقعك على الخريطة ← اختار طريقة الدفع (إنستا باي أو فودافون كاش مع صورة الإيصال، أو كاش عند الاستلام) ← أكد الطلب. وفريقنا هيكلمك يأكد معاك.' },
        { id: 'account', el: 'account', title: 'حسابك وبرنامج نقاطي 🎁', text: 'سجل بحساب جوجل بضغطة واحدة. من «حسابي» تتابع مشترياتك: لما توصل 1000 ج.م في الشهر تاخد خصم 3% لمدة 30 يوم، وفيه هدايا عند 3000 و5000 و7000 ج.م.' },
        { id: 'chat', el: 'chat', title: 'مساعدك الذكي', text: 'محتار؟ كلّم المساعد هنا، يرشحلك منتجات ويضيفها للسلة بنفسه.' },
        { id: 'end', title: 'جاهز تتسوق! 🛍️', text: 'كده عرفت كل حاجة. تسوق ممتع!' },
      ];
      const steps = raw.filter(s => !s.el || (s.el === 'add' ? document.querySelector('[aria-label="أضف للسلة"]') : visible(s.el)));
      steps.forEach((s, i) => {
        const el = s.el === 'add' ? document.querySelector<HTMLElement>('[aria-label="أضف للسلة"]') : s.el ? visible(s.el) : undefined;
        const last = i === steps.length - 1;
        t.addStep({ id: s.id, title: s.title, text: s.text, ...(el ? { attachTo: { element: el, on: 'bottom' as const } } : {}),
          buttons: [
            ...(i > 0 ? [{ text: 'السابق', secondary: true, action: () => t.back() }] : [{ text: 'تخطي', secondary: true, action: () => t.cancel() }]),
            { text: last ? 'يلا نتسوق' : 'التالي', action: () => (last ? t.complete() : t.next()) },
          ] });
      });
      tour = t; t.start();
    }, 1500);
    return () => { window.clearTimeout(timer); tour?.cancel(); };
  }, []);
  return null;
}
