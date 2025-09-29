"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ChunkErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 检查是否是chunk加载错误
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chunk Error Boundary caught an error:', error, errorInfo);
    
    // 如果是chunk加载错误，尝试重新加载页面
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      this.setState({ hasError: true, error });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
    // 重新加载页面以获取最新的chunk
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">页面加载失败</h2>
          <p className="text-gray-600">
            页面资源加载出现问题，这通常是由于网络问题或缓存问题导致的。
          </p>
          
          {error && (
            <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded">
              {error.message}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载页面
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
