import React from 'react';

interface TileProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tile({ title, children, className = '' }: TileProps) {
  return (
    <div className={`relative flex flex-col p-6 overflow-hidden ${className}`}>
      {title && (
        <div className="absolute top-4 left-4 right-4 text-center">
          <h2 title={title} className="font-serif text-sm tracking-widest text-charcoal-muted uppercase truncate">{title}</h2>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center h-full w-full mt-4">
        {children}
      </div>
    </div>
  );
}
