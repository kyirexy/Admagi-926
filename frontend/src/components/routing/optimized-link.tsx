"use client";

import Link from 'next/link';
import { ReactNode } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onMouseEnter?: () => void;
  onClick?: () => void;
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  onMouseEnter,
  onClick 
}: OptimizedLinkProps) {
  return (
    <Link 
      href={href}
      className={className}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}
