'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/navbar';

// Tag color mapping with a diverse color palette
const TAG_COLORS: { [key: string]: string } = {
  'Algorithm': 'bg-[#60A5FA] text-white', // Bright blue
  'Design': 'bg-[#F472B6] text-white', // Pink
  'Machine Learning': 'bg-[#34D399] text-white', // Emerald
  'AI': 'bg-[#A78BFA] text-white', // Purple
  'Data Structures': 'bg-[#FBBF24] text-white', // Amber
  'Web Development': 'bg-[#F87171] text-white', // Red
  'Mobile': 'bg-[#2DD4BF] text-white', // Teal
  'Security': 'bg-[#818CF8] text-white', // Indigo
  'Cloud': 'bg-[#6EE7B7] text-white', // Green
  'Database': 'bg-[#FB923C] text-white', // Orange
};

// Function to get a color based on tag name or generate one
const getTagColor = (tagName: string): string => {
  if (TAG_COLORS[tagName]) return TAG_COLORS[tagName];
  
  // Generate a consistent color based on the tag name
  const colors = Object.values(TAG_COLORS);
  const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

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

  const handleUnsave = async (testId: number) => {
    if (!session?.user?.id) return;

    try {
      // Delete the saved test record
      const { error } = await supabase
        .from('user-saved-tests')
        .delete()
        .eq('user_id', session.user.id)
        .eq('test_id', testId);

      if (error) throw error;

      // Update UI by removing the test
      setTests(tests.filter(t => t.id !== testId));
      toast.success('Test removed from saved items');
    } catch (error) {
      console.error('Error unsaving test:', error);
      toast.error('Failed to remove test from saved items');
    }
  };

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <div className="p-5">
      <Navbar />
      <h1 className="text-4xl font-bold pt-5 mb-5">Saved Quizzes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {tests.map(t => (
          <div
            key={t.id}
            className="bg-[#E8F4F8] rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] relative group"
          >
            <button
              onClick={() => handleUnsave(t.id)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Unsave test"
            >
              <Bookmark className="w-5 h-5 fill-current" />
            </button>
            <h2 className="font-semibold text-lg mb-3 text-gray-800 pr-8">{t.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {t.tags && t.tags.length > 0 ? (
                t.tags.map((tagId: number) => {
                  const tagName = tagMap[tagId] || `Tag ${tagId}`;
                  return (
                    <span 
                      key={tagId} 
                      className={`px-3 py-0.5 rounded-full text-sm font-medium ${
                        getTagColor(tagName)
                      }`}
                    >
                      {tagName}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-gray-400">No tags</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}