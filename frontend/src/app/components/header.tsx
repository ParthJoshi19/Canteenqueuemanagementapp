import { UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface HeaderProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  queueInfo: {
    currentQueue: number;
    averageWaitTime: number;
  };
}

export function Header({ selectedCategory, onCategoryChange, queueInfo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl">Campus Canteen</h1>
                <p className="text-sm text-muted-foreground">Order ahead, skip the queue</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl text-primary">{queueInfo.currentQueue}</div>
                <div className="text-muted-foreground">in queue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-primary">{queueInfo.averageWaitTime}m</div>
                <div className="text-muted-foreground">avg wait</div>
              </div>
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

          <div className="sm:hidden flex items-center justify-around py-2 border-t">
            <div className="text-center">
              <div className="text-lg text-primary">{queueInfo.currentQueue}</div>
              <div className="text-xs text-muted-foreground">in queue</div>
            </div>
            <div className="text-center">
              <div className="text-lg text-primary">{queueInfo.averageWaitTime}m</div>
              <div className="text-xs text-muted-foreground">avg wait</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
