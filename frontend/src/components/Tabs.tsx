// frontend/src/components/Tabs.tsx
type Props = {
  value: 'watching' | 'want_to_watch' | 'watched';
  onChange: (v: 'watching' | 'want_to_watch' | 'watched') => void;
};

export function Tabs({ value, onChange }: Props) {
  const options = [
    { label: 'Watching', key: 'watching' },
    { label: 'Want to Watch', key: 'want_to_watch' },
    { label: 'Watched', key: 'watched' },
  ];

  return (
    <div className="flex space-x-2">
      {options.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key as any)}
          className={`px-4 py-2 rounded border ${
            value === tab.key
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

