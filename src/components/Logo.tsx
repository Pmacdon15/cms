export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
      <path
        d="M22 10L10 16L15 18L18 22L22 10Z"
        fill="white"
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="20" r="1.5" fill="#93c5fd" />
    </svg>
  );
}

export default Logo;
