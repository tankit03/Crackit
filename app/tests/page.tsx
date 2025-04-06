'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SortAsc, SortDesc } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Test {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  university_id: number;
  class_id: number;
  tags: string;
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

type SortOption = 'newest' | 'oldest';

export default function TestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<{ id: number; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);
  const [filteredTags, setFilteredTags] = useState<{ id: number; name: string }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const supabase = createClient();

  // Fetch universities
  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching universities:', error);
      return;
    }

    setUniversities(data || []);
    setFilteredUniversities(data || []);
  };

  // Fetch all tags
  const fetchTags = async () => {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }

    const map: TagMap = {};
    tags?.forEach(tag => {
      map[tag.id] = tag.name;
    });
    setTagMap(map);
    setAvailableTags(tags || []);
    setFilteredTags(tags || []);
  };

  const searchTests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('test')
        .select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `);

      // Apply filters
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedUniversity && selectedUniversity !== 'all') {
        query = query.eq('university_id', selectedUniversity);
      }

      if (selectedTag && selectedTag !== 'all') {
        // Use LIKE to match the tag ID in the JSON array string
        query = query.like('tags', `%${selectedTag}%`);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: sortBy === 'oldest' });

      const { data, error: searchError } = await query;

      if (searchError) {
        console.error('Search error:', searchError);
        throw new Error(searchError.message);
      }

      setTests(data || []);
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

  // Initial load
  useEffect(() => {
    fetchUniversities();
    fetchTags();
    searchTests();
  }, []);

  // Search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTests();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedUniversity, selectedTag, sortBy]);

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
          
          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative col-span-full md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={selectedUniversity}
              onValueChange={setSelectedUniversity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search universities..."
                    className="pl-8 h-9 mb-2"
                    onChange={(e) => {
                      const input = e.target.value.toLowerCase();
                      setFilteredUniversities(
                        universities.filter(uni =>
                          uni.name.toLowerCase().includes(input)
                        )
                      );
                    }}
                  />
                </div>
                {filteredUniversities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id.toString()}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTag}
              onValueChange={setSelectedTag}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    className="pl-8 h-9 mb-2"
                    onChange={(e) => {
                      const input = e.target.value.toLowerCase();
                      setFilteredTags(
                        availableTags.filter(tag =>
                          tag.name.toLowerCase().includes(input)
                        )
                      );
                    }}
                  />
                </div>
                {filteredTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
                No tests found. Try different search terms or filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 