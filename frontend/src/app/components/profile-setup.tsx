import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Camera, Loader2, User, Dices, Sparkles, ArrowRight, X } from 'lucide-react';
import { apiUrl } from '@/app/lib/api';
import { AVATAR_PRESETS, getRandomGuestName } from '@/app/data/avatar-presets';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  profileCompleted: boolean;
}

interface ProfileSetupProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
  onCancel?: () => void;
}

export function ProfileSetup({ user, onComplete, onCancel }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.profilePicture || AVATAR_PRESETS[0].emoji);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setError('');
    const blobUrl = URL.createObjectURL(file);
    setSelectedAvatar(blobUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await fetch(apiUrl('/api/profile/picture'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = (await res.json()) as { profilePicture?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to upload image.');
        setSelectedAvatar(user.profilePicture || AVATAR_PRESETS[0].emoji);
      } else {
        setSelectedAvatar(data.profilePicture ?? '');
      }
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Network error uploading image.');
      setSelectedAvatar(user.profilePicture || AVATAR_PRESETS[0].emoji);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRandomizeName = () => {
    setDisplayName(getRandomGuestName());
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsSaving(true);

    const finalDisplayName = displayName.trim() || user.username || 'Guest';

    try {
      const res = await fetch(apiUrl('/api/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: finalDisplayName,
          bio: bio.trim(),
          profilePicture: selectedAvatar,
        }),
      });

      const data = (await res.json()) as UserProfile & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save profile.');
      } else {
        onComplete(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (onCancel) {
      onCancel();
    } else {
      onComplete({
        ...user,
        displayName: displayName || user.displayName || user.username || 'Guest',
        profilePicture: selectedAvatar || user.profilePicture,
        profileCompleted: true,
      });
    }
  };

  const isImg = selectedAvatar.startsWith('http') || selectedAvatar.startsWith('data:') || selectedAvatar.startsWith('/');
  const emoji = !isImg && selectedAvatar ? selectedAvatar.replace('emoji:', '') : null;
  const initials = (displayName || user.username || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse delay-1000" />

      <div className="z-10 w-full max-w-lg">
        <Card className="border-border/50 shadow-2xl bg-card/90 backdrop-blur-xl transition-all duration-300">
          <CardHeader className="space-y-1 text-center relative">
            {onCancel && (
              <button
                type="button"
                onClick={handleSkip}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-bounce" />
              Your Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Personalize your avatar and name for the canteen queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              {/* Main Avatar Preview */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload custom image"
                >
                  <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl transition-transform group-hover:scale-105">
                    {isImg ? (
                      <AvatarImage src={selectedAvatar} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl select-none">
                      {emoji || initials || <User className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureSelect}
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload custom photo'}
                  </button>
                </div>
              </div>

              {/* Quick 1-Tap Avatar Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Or Pick a 1-Tap Preset
                </Label>
                <div className="grid grid-cols-5 gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/40">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatar === preset.emoji || selectedAvatar === `emoji:${preset.emoji}`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedAvatar(preset.emoji)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'bg-background/80 hover:bg-background border border-border/50 text-foreground'
                        }`}
                        title={preset.name}
                      >
                        <span className="text-2xl">{preset.emoji}</span>
                        <span className="text-[10px] mt-1 truncate max-w-full font-medium opacity-80">
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display name with Randomize Dice */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="displayName" className="text-foreground/90 font-medium">
                    Display Name
                  </Label>
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Randomize
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="e.g. Hungry Foodie"
                    className="bg-background/50 border-input hover:border-primary/50 focus:border-primary transition-colors pr-10"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="Generate fun name"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bio (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground/90 font-medium text-xs">
                  Bio / Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="e.g. Regular coffee drinker, loves spicy snacks!"
                  className="bg-background/50 border-input hover:border-primary/50 focus:border-primary transition-colors resize-none text-sm"
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 h-11 border-border/60 hover:bg-muted font-medium"
                  disabled={isSaving || isUploading}
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all gap-2"
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
