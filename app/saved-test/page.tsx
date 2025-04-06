'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { Bookmark, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/navbar';
import Link from 'next/link';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [availableTags, setAvailableTags] = useState<{id: number, name: string}[]>([]);

  // Filter tests based on selected tags
  const filteredTests = tests.filter(test => {
    if (selectedTags.size === 0) return true;
    return test.tags?.some((tagId: number) => selectedTags.has(tagId));
  });

  // Filter available tags based on search query
  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      setAvailableTags(tagData || []);

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

  const handleTagToggle = (tagId: number) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTags(newSelectedTags);
  };

  const clearFilters = () => {
    setSelectedTags(new Set());
    setSearchQuery('');
  };

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className="w-56 bg-white rounded-xl p-4 h-fit shadow-sm sticky top-24">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Filter by Tags</h3>
              {selectedTags.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  Clear <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {filteredTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.has(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-5">Saved Quizzes</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredTests.map(t => (
                <Link 
                  href={`/test/${t.id}`} 
                  key={t.id}
                  className="group relative"
                >
                  <div className="bg-[#E8F4F8] rounded-lg p-3 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] h-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent navigation
                        handleUnsave(t.id);
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
                      aria-label="Unsave test"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                    <h2 className="font-semibold text-base mb-2 text-gray-800 pr-6 line-clamp-2">{t.name}</h2>
                    <div className="flex flex-wrap gap-1">
                      {t.tags && t.tags.length > 0 ? (
                        t.tags.map((tagId: number) => {
                          const tagName = tagMap[tagId] || `Tag ${tagId}`;
                          return (
                            <span 
                              key={tagId} 
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                getTagColor(tagName)
                              }`}
                            >
                              {tagName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}