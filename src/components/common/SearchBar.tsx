import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  size?: 'default' | 'lg';
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  className,
  size = 'default',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
            size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus={autoFocus}
          className={cn(
            'pr-20',
            size === 'lg' ? 'h-14 pl-12 text-lg' : 'pl-10'
          )}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              size === 'lg' ? 'right-24 h-8 w-8' : 'right-20 h-7 w-7'
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          variant="gradient"
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2',
            size === 'lg' ? 'h-11' : 'h-7'
          )}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
