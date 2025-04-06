'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  SortAsc,
  SortDesc,
  BookmarkIcon,
  X,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [universities, setUniversities] = useState<
    { id: number; name: string }[]
  >([]);
  const [filteredUniversities, setFilteredUniversities] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<
    { id: number; name: string }[]
  >([]);
  const [filteredTags, setFilteredTags] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const supabase = createClient();
  const [userName, setUserName] = useState<string>('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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

  // Fetch classes
  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching classes:', error);
      return;
    }

    setClasses(data || []);
    setFilteredClasses(data || []);
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
    tags?.forEach((tag) => {
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

      let query = supabase.from('test').select(`
          *,
          universities (
            name
          ),
          classes (
            name
          )
        `);

      // Build filter conditions
      if (searchTerm) {
        // Search across multiple fields using separate conditions
        query = query.or(`name.ilike.%${searchTerm}%`);
      }

      // Apply additional filters with AND logic
      if (selectedUniversity && selectedUniversity !== 'all') {
        query = query.eq('university_id', selectedUniversity);
      }

      if (selectedClass && selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      if (selectedTag && selectedTag !== 'all') {
        query = query.like('tags', `%${selectedTag}%`);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: sortBy === 'oldest' });

      const { data: nameResults, error: nameError } = await query;

      if (nameError) {
        console.error('Search error:', nameError);
        throw new Error(nameError.message);
      }

      // If searching by term, filter by all fields client-side
      let filteredData = nameResults || [];
      if (searchTerm && filteredData.length >= 0) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter((test) => {
          const testTags = test.tags ? parseTagIds(test.tags) : [];
          return (
            test.name.toLowerCase().includes(searchLower) ||
            test.universities?.name.toLowerCase().includes(searchLower) ||
            test.classes?.name.toLowerCase().includes(searchLower) ||
            testTags.some((tagId) =>
              tagMap[tagId]?.toLowerCase().includes(searchLower)
            )
          );
        });
      }

      setTests(filteredData);
    } catch (err) {
      console.error('Error in searchTests:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while searching'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Parse tags string to array
  const parseTagIds = (tagsString: string): number[] => {
    try {
      if (!tagsString || tagsString.trim() === '') {
        return [];
      }
      // Handle both string array format and direct array format
      const parsed =
        typeof tagsString === 'string' ? JSON.parse(tagsString) : tagsString;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing tags:', e);
      return [];
    }
  };

  // Initial load
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      }
    };

    fetchUserData();
    fetchUniversities();
    fetchClasses();
    fetchTags();
    searchTests();
  }, []);

  // Search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTests();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedUniversity, selectedClass, selectedTag, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Topic</h3>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="border-2 border-gray-200 focus:border-[#F2C76E] focus:ring-2 focus:ring-[#F2C76E]">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {filteredTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id.toString()}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">University</h3>
        <Select
          value={selectedUniversity}
          onValueChange={setSelectedUniversity}
        >
          <SelectTrigger className="border-2 border-gray-200 focus:border-[#F2C76E] focus:ring-2 focus:ring-[#F2C76E]">
            <SelectValue placeholder="Select university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {filteredUniversities.map((uni) => (
              <SelectItem key={uni.id} value={uni.id.toString()}>
                {uni.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Class</h3>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="border-2 border-gray-200 focus:border-[#F2C76E] focus:ring-2 focus:ring-[#F2C76E]">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {filteredClasses.map((cls) => (
              <SelectItem key={cls.id} value={cls.id.toString()}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Sort By</h3>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="border-2 border-gray-200 focus:border-[#F2C76E] focus:ring-2 focus:ring-[#F2C76E]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Let's Learn, <span className="text-[#F2C76E]">{userName}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                <Filter size={20} />
              </button>
              <Link href="/saved-quizzes">
                <Button
                  variant="outline"
                  className="bg-[#F2C76E] text-white border-none hover:bg-[#E5B85B] transition-colors"
                >
                  Saved Quizzes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Quiz Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[#F2C76E] focus:ring-2 focus:ring-[#F2C76E] focus:border-transparent"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F2C76E]"
              size={20}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FiltersContent />
          </div>

          {/* Mobile Filters Modal */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
              <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <FiltersContent />
              </div>
            </div>
          )}

          {/* Tests Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <p>Loading tests...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : tests.length === 0 ? (
                <p>No tests found.</p>
              ) : (
                tests.map((test) => (
                  <Link key={test.id} href={`/test/${test.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200 bg-[#FDF6E9] relative border-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-gray-800">
                          {test.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {test.tags &&
                              parseTagIds(test.tags).map((tagId, index) => {
                                const tagColors = [
                                  'bg-[#67B7D0] text-white',
                                  'bg-[#9EC582] text-white',
                                  'bg-[#E5A5BD] text-white',
                                  'bg-[#F2C76E] text-white',
                                ];
                                const colorIndex = index % tagColors.length;
                                return (
                                  <span
                                    key={tagId}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tagColors[colorIndex]}`}
                                  >
                                    {tagMap[tagId]}
                                  </span>
                                );
                              })}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span>{test.universities?.name}</span>
                            <span className="mx-2">•</span>
                            <span>{test.classes?.name}</span>
                          </div>
                        </div>
                      </CardContent>
                      <button
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F5E6D0] transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <BookmarkIcon className="h-5 w-5 text-[#F2C76E]" />
                      </button>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
