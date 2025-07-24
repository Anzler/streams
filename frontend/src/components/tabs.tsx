// frontend/src/components/Tabs.tsx
import { useState } from 'react';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

const OPTIONS = [
  { key: 'watching', label: 'Watching' },
  { key: 'want', label: 'Want to Watch' },
  { key: 'watched', label: 'Watched' },
];

export function Tabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 mb-4">
      {OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded ${
            value === key
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

