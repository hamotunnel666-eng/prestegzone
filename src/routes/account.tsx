import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/components/store/store-context';
import { PageTitle, StoreShell } from '@/components/store/store-ui';

export const Route = createFileRoute('/account')({
  head: () => ({ meta: [
    { title: 'حسابي | برستيج الأقصر' },
    { name: 'description', content: 'بيانات الدخول إلى برستيج الأقصر.' },
    { property: 'og:title', content: 'حسابي | برستيج الأقصر' },
    { property: 'og:description', content: 'حسابك في برستيج الأقصر.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Account,
});

function Account() {
  const { session } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: '/auth', replace: true });
  }
  return <StoreShell><main className="mx-auto min-h-[55vh] max-w-7xl px-6 py-12">
    <PageTitle eyebrow="حسابك" title="حسابي" />
    {session ? <div className="space-y-6">
      <p dir="ltr" className="w-fit text-sm text-muted-foreground">{session.user.email}</p>
      <div className="flex flex-wrap gap-3"><Button asChild><Link to="/admin">لوحة الإدارة</Link></Button><Button variant="outline" onClick={signOut}>تسجيل الخروج</Button></div>
    </div> : <Button asChild><Link to="/auth">تسجيل الدخول</Link></Button>}
  </main></StoreShell>;
}