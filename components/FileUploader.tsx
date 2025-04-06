import { useState, useCallback } from 'react';
import { convertFileToText } from '@/utils/fileConverter';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  onTextExtracted: (text: string) => void;
}

export default function FileUploader({ onTextExtracted }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        const text = await convertFileToText(file);
        onTextExtracted(text);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to extract text from file'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onTextExtracted]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.pptx,.docx"
          onChange={handleFileUpload}
          disabled={isLoading}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span>Upload File</span>
          </Button>
        </label>
        <p className="text-sm text-muted-foreground">
          Supported formats: PDF, PPTX, DOCX
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Extracting text...</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
