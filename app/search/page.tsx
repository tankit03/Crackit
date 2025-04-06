'use client';

import { useState } from 'react';
import SearchBar from '@/components/search-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface Test {
  id: number;
  name: string;
  created_at: string;
  questions: any;
  user_id: number;
  university_id: number;
  class_id: number;
  tags: number[];
  universities: { name: string };
  classes: { name: string };
}

export default function SearchPage() {
  const [results, setResults] = useState<Test[]>([]);

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Search Tests</h1>
        <SearchBar onResultsChange={setResults} />
      </div>

      <div className="w-full max-w-4xl grid gap-4">
        {results.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle>{test.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {format(new Date(test.created_at), 'PPP')} •{' '}
                {test.universities?.name} • {test.classes?.name}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tags: {test.tags.join(', ')}
              </p>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No results found. Try searching with different terms.
          </div>
        )}
      </div>
    </div>
  );
}
