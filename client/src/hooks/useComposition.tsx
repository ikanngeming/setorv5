import * as React from "react";

export interface UseCompositionOptions<T extends HTMLElement> {
  onKeyDown?: React.KeyboardEventHandler<T>;
  onCompositionStart?: React.CompositionEventHandler<T>;
  onCompositionEnd?: React.CompositionEventHandler<T>;
}

export function useComposition<T extends HTMLElement>({
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
}: UseCompositionOptions<T>) {
  const isComposingRef = React.useRef(false);

  const handleCompositionStart = React.useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposingRef.current = true;
      onCompositionStart?.(e);
    },
    [onCompositionStart]
  );

  const handleCompositionEnd = React.useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposingRef.current = false;
      onCompositionEnd?.(e);
    },
    [onCompositionEnd]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<T>) => {
      if (isComposingRef.current && e.key === "Enter") {
        e.preventDefault();
        return;
      }
      onKeyDown?.(e);
    },
    [onKeyDown]
  );

  return {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
    isComposing: () => isComposingRef.current,
  };
}
