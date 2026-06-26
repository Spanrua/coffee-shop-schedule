import type { Store } from '../types';

interface StoreSelectorProps {
  stores: Store[];
  value: number | '';
  onChange: (storeId: number) => void;
  label?: string;
  disabled?: boolean;
}

export default function StoreSelector({
  stores,
  value,
  onChange,
  label = '门店',
  disabled = false,
}: StoreSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled || stores.length <= 1}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </label>
  );
}
