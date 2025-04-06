'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Test {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  university_id: number;
  class_id: number;
  tags: string;  // This is actually a JSON string
  description?: string;
  universities: {
    name: string;
  };
  classes: {
    name: string;
  };
}

interface TagMap {
  [key: number]: string;
}

export default function TestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all tags and create a map of id to name
  const fetchTags = async () => {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name');

    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }

    const map: TagMap = {};
    tags?.forEach(tag => {
      map[tag.id] = tag.name;
    });
    setTagMap(map);
  };

  const searchTests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get tests that match by name
      const { data: nameTagTests, error: searchError } = await supabase
        .from('test')
        .select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `)
        .ilike('name', `%${searchTerm}%`);

      if (searchError) {
        console.error('Search error:', searchError);
        throw new Error(searchError.message);
      }

      // Get tests from matching universities
      const { data: uniMatches } = await supabase
        .from('universities')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      const uniIds = uniMatches?.map(uni => uni.id) || [];

      const { data: uniTests } = await supabase
        .from('test')
        .select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `)
        .in('university_id', uniIds);

      // Get tests from matching classes
      const { data: classMatches } = await supabase
        .from('classes')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      const classIds = classMatches?.map(cls => cls.id) || [];

      const { data: classTests } = await supabase
        .from('test')
        .select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `)
        .in('class_id', classIds);

      // Get tests with matching tags
      const { data: tagMatches } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      const tagIds = tagMatches?.map(tag => tag.id) || [];
      
      const { data: tagTests } = tagIds.length > 0 ? await supabase
        .from('test')
        .select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `)
        .contains('tags', tagIds) : { data: [] };

      // Combine and deduplicate results
      const allTests = [
        ...(nameTagTests || []),
        ...(uniTests || []),
        ...(classTests || []),
        ...(tagTests || [])
      ];

      const uniqueTests = Array.from(
        new Map(allTests.map(test => [test.id, test])).values()
      );

      setTests(uniqueTests);
    } catch (err) {
      console.error('Error in searchTests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse tags string to array
  const parseTagIds = (tagsString: string): number[] => {
    try {
      return JSON.parse(tagsString);
    } catch (e) {
      console.error('Error parsing tags:', e);
      return [];
    }
  };

  // Initial load of tests and tags
  useEffect(() => {
    fetchTags();
    searchTests();
  }, []);

  // Debounced search when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTests();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Published Tests</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests by name, university, class, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle>{test.name || 'Untitled Test'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-muted-foreground">
                        {test.universities?.name} • {test.classes?.name} • {formatDate(test.created_at)}
                      </div>
                      {test.description && (
                        <p className="text-sm">{test.description}</p>
                      )}
                      {test.tags && (
                        <div className="flex flex-wrap gap-2">
                          {parseTagIds(test.tags).map((tagId, index) => (
                            <span
                              key={index}
                              className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                            >
                              {tagMap[tagId] || `Tag ${tagId}`}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4">
                        <Button asChild>
                          <Link href={`/test/${test.id}`}>Take Test</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No tests found. Try different search terms.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 