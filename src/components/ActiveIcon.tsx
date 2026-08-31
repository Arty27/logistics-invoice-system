'use client';

type ActiveIconProps = {
  iconType?: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
};

const ActiveIcon = ({ iconType = 'ACTIVE' }: ActiveIconProps) => {
  if (iconType === 'ACTIVE') {
    return (
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        aria-label="Delivery active"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>

        <span className="text-xs font-medium text-green-700">Active</span>
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
      <span className="text-2xl text-green-600">✓</span>
    </div>
  );
};

export default ActiveIcon;
