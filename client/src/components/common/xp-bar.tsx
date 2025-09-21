import { cn } from "@/lib/utils";

interface XpBarProps {
  currentXp: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function XpBar({ 
  currentXp, 
  level, 
  size = 'md', 
  className, 
  showText = true 
}: XpBarProps) {
  // Calculate XP needed for next level (simple formula: level * 100)
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = currentXp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('space-y-1', className)} data-testid="xp-bar">
      {showText && (
        <div className={cn('flex items-center justify-between', textClasses[size])}>
          <span className="text-muted-foreground">Level {level}</span>
          <span className="text-muted-foreground">
            {xpInCurrentLevel}/{xpNeededForLevel} XP
          </span>
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className="xp-bar-fill h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${progress}%`,
            '--fill-width': `${progress}%`
          } as React.CSSProperties}
          data-testid="xp-progress"
        />
      </div>
    </div>
  );
}
