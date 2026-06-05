import { useEffect } from 'react';

interface KeyboardHandlers {
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
}

export function useKeyboard(
  handlers: KeyboardHandlers,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeydown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlers.togglePlay();
          break;
        case 'KeyN':
          handlers.next();
          break;
        case 'KeyB':
          handlers.prev();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handlers, enabled]);
}
