import { Badge } from "@/components/ui/badge";

interface GameTagProps {
  game: any;
  variant?: 'default' | 'secondary' | 'outline';
}

export default function GameTag({ game, variant = 'default' }: GameTagProps) {
  const getGameIcon = (gameName: string) => {
    const name = gameName.toLowerCase();
    if (name.includes('valorant')) return 'fas fa-crosshairs';
    if (name.includes('apex')) return 'fas fa-bullseye';
    if (name.includes('counter-strike') || name.includes('cs2')) return 'fas fa-bomb';
    if (name.includes('minecraft')) return 'fas fa-cube';
    if (name.includes('fortnite')) return 'fas fa-parachute-box';
    if (name.includes('league') || name.includes('lol')) return 'fas fa-crown';
    if (name.includes('overwatch')) return 'fas fa-shield-alt';
    return 'fas fa-gamepad';
  };

  const getGameColor = (gameName: string) => {
    const name = gameName.toLowerCase();
    if (name.includes('valorant')) return 'bg-red-500/20 text-red-400';
    if (name.includes('apex')) return 'bg-orange-500/20 text-orange-400';
    if (name.includes('counter-strike') || name.includes('cs2')) return 'bg-yellow-500/20 text-yellow-400';
    if (name.includes('minecraft')) return 'bg-green-500/20 text-green-400';
    if (name.includes('fortnite')) return 'bg-blue-500/20 text-blue-400';
    if (name.includes('league') || name.includes('lol')) return 'bg-purple-500/20 text-purple-400';
    if (name.includes('overwatch')) return 'bg-orange-500/20 text-orange-400';
    return 'bg-primary/20 text-primary';
  };

  return (
    <Badge 
      variant={variant}
      className={`${getGameColor(game.name)} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 w-fit`}
      data-testid={`game-tag-${game.id}`}
    >
      <i className={`${getGameIcon(game.name)}`}></i>
      <span>{game.name}</span>
    </Badge>
  );
}
