'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pushUpdate = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set('q', newValue);
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushUpdate(next), 300);
  };

  const handleClear = () => {
    setValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    pushUpdate('');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search skills and prompts..."
        autoFocus
        className="w-full pl-11 pr-10 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 transition-shadow"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
