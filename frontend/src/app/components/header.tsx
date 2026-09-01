import { UtensilsCrossed, User, LogOut, UserCog, CalendarDays, Sparkles, Network } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface HeaderProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  queueInfo: {
    currentQueue: number;
    averageWaitTime: number;
  };
  userProfile?: {
    displayName: string;
    profilePicture: string;
    username: string;
  };
  onProfileClick?: () => void;
  onLogout?: () => void;
  onOpenEventPreorder?: () => void;
  onOpenEventOrdersList?: () => void;
  onOpenDsInspector?: () => void;
}

export function Header({
  selectedCategory,
  onCategoryChange,
  queueInfo,
  userProfile,
  onProfileClick,
  onLogout,
  onOpenEventPreorder,
  onOpenEventOrdersList,
  onOpenDsInspector,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Campus Canteen</h1>
                <p className="text-sm text-muted-foreground">Order ahead, skip the queue</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 text-sm">
              {/* DS Inspector Trigger Button */}
              {onOpenDsInspector && (
                <Button
                  onClick={onOpenDsInspector}
                  variant="outline"
                  className="flex items-center gap-1.5 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold text-xs h-9 shadow-sm"
                >
                  <Network className="w-4 h-4 text-purple-600 dark:text-purple-300 animate-pulse" />
                  DS Inspector
                </Button>
              )}

              {/* Event Pre-Order Button */}
              {onOpenEventPreorder && (
                <Button
                  onClick={onOpenEventPreorder}
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs h-9 shadow-sm"
                >
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Event / Bulk Order
                  <span className="px-1.5 py-0.2 bg-primary text-primary-foreground text-[10px] rounded-full font-bold">
                    Pre-Order
                  </span>
                </Button>
              )}

              <div className="hidden sm:block text-center">
                <div className="text-2xl font-bold text-primary">{queueInfo.currentQueue}</div>
                <div className="text-xs text-muted-foreground">in queue</div>
              </div>
              <div className="hidden sm:block text-center">
                <div className="text-2xl font-bold text-primary">{queueInfo.averageWaitTime}m</div>
                <div className="text-xs text-muted-foreground">avg wait</div>
              </div>

              {userProfile && (() => {
                const pic = userProfile.profilePicture || '';
                const isImg = pic.startsWith('http') || pic.startsWith('data:') || pic.startsWith('/');
                const emoji = !isImg && pic ? pic.replace('emoji:', '') : null;
                const initials = (userProfile.displayName || userProfile.username || '?').slice(0, 2).toUpperCase();

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="ml-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-transform hover:scale-105"
                      >
                        <Avatar className="w-10 h-10 border-2 border-primary/30 shadow-sm">
                          {isImg && <AvatarImage src={pic} alt={userProfile.displayName || userProfile.username} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                            {emoji || initials}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2">
                      <div className="flex items-center gap-2.5 px-2 py-2">
                        <Avatar className="w-8 h-8 border border-border">
                          {isImg && <AvatarImage src={pic} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {emoji || initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-semibold truncate">
                            {userProfile.displayName || userProfile.username}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            @{userProfile.username}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {onOpenEventOrdersList && (
                        <DropdownMenuItem onClick={onOpenEventOrdersList} className="cursor-pointer py-2 text-xs font-medium">
                          <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                          My Event Pre-Orders
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer py-2 text-xs font-medium">
                        <UserCog className="w-4 h-4 mr-2 text-primary" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive cursor-pointer py-2 text-xs font-medium">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </div>
          </div>
          
          <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
            <TabsList className="w-full justify-start bg-secondary">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="main">Main Dishes</TabsTrigger>
              <TabsTrigger value="beverage">Beverages</TabsTrigger>
              <TabsTrigger value="snack">Snacks</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="sm:hidden flex items-center justify-between py-2 border-t gap-2">
            {onOpenEventPreorder && (
              <Button
                onClick={onOpenEventPreorder}
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs font-semibold border-primary/40 bg-primary/5 text-primary gap-1"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Event Order
              </Button>
            )}

            <div className="flex items-center gap-3 px-2">
              <div className="text-center">
                <div className="text-sm font-bold text-primary">{queueInfo.currentQueue}</div>
                <div className="text-[10px] text-muted-foreground">in queue</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-primary">{queueInfo.averageWaitTime}m</div>
                <div className="text-[10px] text-muted-foreground">avg wait</div>
              </div>
            </div>

            {userProfile && (() => {
              const pic = userProfile.profilePicture || '';
              const isImg = pic.startsWith('http') || pic.startsWith('data:') || pic.startsWith('/');
              const emoji = !isImg && pic ? pic.replace('emoji:', '') : null;
              const initials = (userProfile.displayName || userProfile.username || '?').slice(0, 2).toUpperCase();

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-transform hover:scale-105"
                    >
                      <Avatar className="w-9 h-9 border-2 border-primary/30 shadow-sm">
                        {isImg && <AvatarImage src={pic} alt={userProfile.displayName || userProfile.username} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {emoji || initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                      <Avatar className="w-8 h-8 border border-border">
                        {isImg && <AvatarImage src={pic} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {emoji || initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">
                          {userProfile.displayName || userProfile.username}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          @{userProfile.username}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {onOpenEventOrdersList && (
                      <DropdownMenuItem onClick={onOpenEventOrdersList} className="cursor-pointer py-2 text-xs font-medium">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                        My Event Pre-Orders
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer py-2 text-xs font-medium">
                      <UserCog className="w-4 h-4 mr-2 text-primary" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive cursor-pointer py-2 text-xs font-medium">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        </div>
      </div>
    </header>
  );
}
