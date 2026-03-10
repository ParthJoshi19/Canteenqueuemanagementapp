import { MenuItem } from '@/app/data/menu-items';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Clock } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
          {item.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{item.prepTime} mins</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl text-primary">${item.price.toFixed(2)}</span>
        <Button onClick={() => onAddToCart(item)} className="bg-primary hover:bg-accent">
          <Plus className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
