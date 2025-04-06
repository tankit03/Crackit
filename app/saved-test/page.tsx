'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Session } from '@supabase/supabase-js';

export default function SavedTestPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [tests,   setTests]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      /* 1️⃣  Auth check */
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { router.push('/sign-in'); return; }
      setSession(s);

      /* 2️⃣  Query the saved tests */
      const { data, error } = await supabase
        .from('user-saved-tests')
        .select(`
          test (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', s.user.id);

      if (error) {
        console.error('Supabase error →', error);
      } else {
        setTests(data?.map(r => r.test) ?? []);
      }

      setLoading(false);
    })();
  }, [router, supabase]);

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <ul className="space-y-3 p-8">
      {tests.map(t => (
        <li key={t.id} className="border rounded p-4">
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-gray-500">
            {new Date(t.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
