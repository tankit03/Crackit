'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Search, Filter } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface Test {
  id: number;
  name: string;
  created_at: string;
  questions: any; // JSON type
  user_id: number;
  university_id: number;
  class_id: number;
  tags: number[];
  universities: { name: string };
  classes: { name: string };
}

interface SearchBarProps {
  onResultsChange: (results: Test[]) => void;
}

export default function SearchBar({ onResultsChange }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: true,
    tags: true,
  });
  const supabase = createClient();

  useEffect(() => {
    const searchTests = async () => {
      if (searchTerm.length < 2) {
        onResultsChange([]);
        return;
      }

      setIsLoading(true);
      try {
        let query = supabase.from('test').select(`
            *,
            universities(name),
            classes(name)
          `);

        // Build the OR conditions based on selected filters
        const conditions = [];
        if (filters.name) {
          conditions.push(`name.ilike.%${searchTerm}%`);
        }
        if (filters.tags) {
          conditions.push(`tags.ilike.%${searchTerm}%`);
        }

        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        } else {
          // If no filters are selected, return empty results
          onResultsChange([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error searching tests:', error);
          return;
        }

        onResultsChange(data || []);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTests, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters, onResultsChange]);

  return (
    <div className="flex gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tests by name or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="name-filter"
                checked={filters.name}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, name: checked as boolean }))
                }
              />
              <Label htmlFor="name-filter">Test Name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tags-filter"
                checked={filters.tags}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, tags: checked as boolean }))
                }
              />
              <Label htmlFor="tags-filter">Tags</Label>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
