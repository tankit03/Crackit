'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface PublishTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: PublishTestData) => Promise<void>;
  testData: {
    questions: any[];
    extractedText: string;
  };
}

export interface PublishTestData {
  name: string;
  university: string;
  className: string;
  tags: string[];
  description?: string;
  questions: any[];
}

export function PublishTestModal({
  isOpen,
  onClose,
  onPublish,
  testData,
}: PublishTestModalProps) {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPublishing(true);

    try {
      await onPublish({
        name,
        university,
        className,
        tags,
        description,
        questions: testData.questions,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish test');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/publish-bg.png')" }}
    >
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-yellow-200 rounded-2xl p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <X className="w-5 h-5" />
        </button>

        <h1 className="font-bold text-[48px] text-center mb-2 font-handdrawn font-love">Egg-cellent!</h1>
        <p className="text-center text-[20px] mb-6">
          You’ve completed the quiz. You may now publish your quiz for others to use.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Test Name<span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter test name"
              required
            />
          </div>

          <div>
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Enter university name"
            />
          </div>

          <div>
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Enter class name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter test description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add tags"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-between gap-4 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </form>
      </div>

      <div className="absolute bottom-6 right-6 hidden sm:block">
        <Image src="/egg-character.png" alt="Egg character" width={200} height={200} />
      </div>
    </div>
  );
}
