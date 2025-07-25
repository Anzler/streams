// frontend/src/components/Tabs.tsx
type Bucket = 'watching' | 'want_to_watch' | 'watched';

type Props = {
  value: Bucket;
  onChange: (val: Bucket) => void;
};

const OPTIONS: { key: Bucket; label: string }[] = [
  { key: 'watching', label: 'Watching' },
  { key: 'want_to_watch', label: 'Want to Watch' }, // ✅ FIXED
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

