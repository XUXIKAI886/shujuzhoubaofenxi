'use client';

import { Card, CardContent } from '@/components/ui/card';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = '加载中...' }: LoadingSpinnerProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-center">{message}</p>
      </CardContent>
    </Card>
  );
}