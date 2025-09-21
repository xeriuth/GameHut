import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
};

export default function UserAvatar({ user, size = 'md', className, onClick, ...props }: UserAvatarProps) {
  const initials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  if (user?.profileImageUrl) {
    return (
      <img
        src={user.profileImageUrl}
        alt={`${user.username || 'User'} avatar`}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold',
        sizeClasses[size],
        size === 'xs' && 'text-xs',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
        size === 'xl' && 'text-xl',
        onClick && 'cursor-pointer hover:bg-primary/30 transition-colors',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {initials}
    </div>
  );
}
