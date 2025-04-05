'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PdfToTextConverterProps {
  onTextExtracted: (text: string) => void;
}

export function PdfToTextConverter({
  onTextExtracted,
}: PdfToTextConverterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('File', file);

      const response = await fetch(
        'https://v2.convertapi.com/convert/pdf/to/txt?auth=secret_KizMbYR2DOGcSQ35',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to convert PDF to text');
      }

      const data = await response.json();

      if (!data.Files || !data.Files[0] || !data.Files[0].FileData) {
        throw new Error('Invalid response format from ConvertAPI');
      }

      // Decode the base64 text
      const decodedText = atob(data.Files[0].FileData);
      onTextExtracted(decodedText);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during conversion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>PDF to Text Converter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              'Upload PDF'
            )}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
