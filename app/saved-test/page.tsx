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
  const [tagMap,  setTagMap]  = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      /* 1️⃣  Auth check */
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { router.push('/sign-in'); return; }
      setSession(s);

      /* 2️⃣  Fetch all tags to create a mapping */
      const { data: tagData } = await supabase
        .from('tags')
        .select('id, name');
      
      // Create a mapping of tag ids to tag names
      const tagMapping = tagData?.reduce((acc, tag) => {
        acc[tag.id] = tag.name;
        return acc;
      }, {} as {[key: number]: string}) || {};
      
      setTagMap(tagMapping);

      /* 3️⃣  Query the saved tests */
      const { data, error } = await supabase
        .from('user-saved-tests')
        .select(`
          test (
            id,
            name,
            created_at,
            tags
          )
        `)
        .eq('user_id', s.user.id);

      if (error) {
        console.error('Supabase error →', error);
      } else {
        // Process each test to convert tags string to array
        const processedTests = data?.map(r => {
          const test = {...r.test};
          
          // Convert tags string to array if it exists and is a string
          if (test.tags && typeof test.tags === 'string' && test.tags.trim() !== '') {
            try {
              test.tags = JSON.parse(test.tags);
            } catch (e) {
              console.error('Error parsing tags for test', test.id, e);
              test.tags = [];
            }
          } else if (!test.tags || test.tags.trim() === '') {
            test.tags = [];
          }
          
          return test;
        }) ?? [];
        
        setTests(processedTests);
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
          <div className="mt-2 flex flex-wrap gap-1">
            {t.tags && t.tags.length > 0 ? (
              t.tags.map((tagId: number) => (
                <span 
                  key={tagId} 
                  className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                >
                  {tagMap[tagId] || `Tag ${tagId}`}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No tags</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}