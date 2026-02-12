interface ToolIndicatorProps {
  name: string;
  isActive?: boolean;
}

export function ToolIndicator({ name, isActive }: ToolIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 py-1">
      {isActive ? (
        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{name}</span>
    </div>
  );
}
