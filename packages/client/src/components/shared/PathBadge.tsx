interface PathBadgeProps {
  path: 'A' | 'B' | 'C';
  size?: 'sm' | 'md';
}

export default function PathBadge({ path, size = 'md' }: PathBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  if (path === 'A') {
    return (
      <span className={`inline-block rounded-full bg-axa-grey-300 text-axa-grey-700 font-medium ${sizeClasses}`}>
        Path A: Checkout
      </span>
    );
  }

  if (path === 'C') {
    return (
      <span className={`inline-block rounded-full bg-axa-blue/10 text-axa-blue font-medium ${sizeClasses}`}>
        Path C: Custom
      </span>
    );
  }

  return (
    <span className={`inline-block rounded-full bg-axa-blue text-white font-medium ${sizeClasses}`}>
      Path B: Elements
    </span>
  );
}
