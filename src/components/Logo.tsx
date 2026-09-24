import { Link } from 'react-router-dom';

export function Logo({ className = '', onClick, onDark = false }: { className?: string; onClick?: () => void; onDark?: boolean }) {
  return (
    <Link to="/" onClick={onClick} className={`inline-flex items-center ${className}`}>
      <img
        src={onDark ? '/assets/logos/faraklit-wordmark-white.png' : '/assets/logos/faraklit-wordmark-navy.png'}
        alt="Faraklit"
        className="h-auto w-[112px]"
      />
    </Link>
  );
}
