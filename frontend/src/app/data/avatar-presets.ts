export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  url?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'burger', name: 'Burger', emoji: '🍔', bgColor: 'bg-amber-500/20 text-amber-600 border-amber-300' },
  { id: 'coffee', name: 'Coffee', emoji: '☕', bgColor: 'bg-orange-500/20 text-orange-600 border-orange-300' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', bgColor: 'bg-red-500/20 text-red-600 border-red-300' },
  { id: 'sandwich', name: 'Sandwich', emoji: '🥪', bgColor: 'bg-yellow-500/20 text-yellow-600 border-yellow-300' },
  { id: 'drink', name: 'Boba / Drink', emoji: '🥤', bgColor: 'bg-pink-500/20 text-pink-600 border-pink-300' },
  { id: 'salad', name: 'Healthy Salad', emoji: '🥗', bgColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-300' },
  { id: 'croissant', name: 'Croissant', emoji: '🥐', bgColor: 'bg-amber-600/20 text-amber-700 border-amber-400' },
  { id: 'panda', name: 'Panda', emoji: '🐼', bgColor: 'bg-zinc-500/20 text-zinc-700 border-zinc-300' },
  { id: 'fox', name: 'Fox', emoji: '🦊', bgColor: 'bg-orange-600/20 text-orange-700 border-orange-400' },
  { id: 'star', name: 'Star Guest', emoji: '⭐', bgColor: 'bg-yellow-400/20 text-yellow-600 border-yellow-300' },
];

export const FUN_GUEST_NAMES = [
  'Hungry Foodie',
  'Coffee Lover',
  'Speedy Snacker',
  'Canteen Explorer',
  'Tasty Tester',
  'Lunch Buddy',
  'Happy Diner',
  'Quick Biter',
  'Campus Gourmet',
  'Chill Sipper',
];

export function getRandomGuestName(): string {
  const name = FUN_GUEST_NAMES[Math.floor(Math.random() * FUN_GUEST_NAMES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${name} #${num}`;
}
