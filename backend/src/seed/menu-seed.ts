import { connectDB } from '../config/db';
import { MenuItem } from '../models/MenuItem';
import dotenv from 'dotenv';
dotenv.config();
const menuItems = [
  {
    name: 'Classic Burger',
    category: 'main' as const,
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBmcmllc3xlbnwxfHx8fDE3NjkwMzI0MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 8,
    description: 'Juicy beef patty with fresh veggies and fries',
  },
  {
    name: 'Club Sandwich',
    category: 'main' as const,
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1738682585466-c287db5404de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW5kd2ljaCUyMG1lYWx8ZW58MXx8fHwxNzY5MDU3NjIwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 5,
    description: 'Triple-decker with chicken, bacon, and lettuce',
  },
  {
    name: 'Margherita Pizza',
    category: 'main' as const,
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHNsaWNlfGVufDF8fHx8MTc2ODk1NDUwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 10,
    description: 'Fresh mozzarella, tomato sauce, and basil',
  },
  {
    name: 'Caesar Salad',
    category: 'main' as const,
    price: 4.49,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZCUyMGJvd2x8ZW58MXx8fHwxNzY5MDQzNDA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 4,
    description: 'Crisp romaine with parmesan and croutons',
  },
  {
    name: 'Pasta Carbonara',
    category: 'main' as const,
    price: 5.49,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzY4OTc2MzE1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 12,
    description: 'Creamy pasta with bacon and parmesan',
  },
  {
    name: 'Cappuccino',
    category: 'beverage' as const,
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1533776992670-a72f4c28235e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXB8ZW58MXx8fHwxNzY5MDIyOTU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 3,
    description: 'Rich espresso with steamed milk foam',
  },
  {
    name: 'Fresh Juice',
    category: 'beverage' as const,
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1544681655-6e5bff3ec253?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqdWljZSUyMGRyaW5rfGVufDF8fHx8MTc2OTA1NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 2,
    description: 'Freshly squeezed orange juice',
  },
  {
    name: 'Croissant',
    category: 'snack' as const,
    price: 2.29,
    image: 'https://images.unsplash.com/photo-1543256840-0709ad5d3726?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwZm9vZHxlbnwxfHx8fDE3NjkwNTc2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    prepTime: 2,
    description: 'Buttery and flaky French pastry',
  },
];

async function seed() {
  await connectDB();

  const count = await MenuItem.countDocuments();
  if (count > 0) {
    console.log(`Menu already seeded (${count} items). Skipping.`);
    process.exit(0);
  }

  await MenuItem.insertMany(menuItems);
  console.log(`Seeded ${menuItems.length} menu items.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
