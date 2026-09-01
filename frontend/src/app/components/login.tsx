import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { Coffee, Lock, User, Loader2, Sparkles, Dices, ArrowRight, UserCheck } from 'lucide-react';
import { apiUrl } from '@/app/lib/api';
import { AVATAR_PRESETS, getRandomGuestName } from '@/app/data/avatar-presets';

interface LoginProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onSwitchToAdmin?: () => void;
}

export function Login({ onLogin, onSwitchToSignup, onSwitchToAdmin }: LoginProps) {
  // Mode: 'guest' (default for ease of use) or 'member'
  const [activeTab, setActiveTab] = useState<'guest' | 'member'>('guest');

  // Member login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Guest login state
  const [guestName, setGuestName] = useState(() => getRandomGuestName());
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0].emoji);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.');
        setIsLoading(false);
      } else {
        onLogin();
      }
    } catch {
      setError('Network error. Please ensure the backend server is running.');
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    const finalName = guestName.trim() || getRandomGuestName();

    try {
      const res = await fetch(apiUrl('/api/auth/guest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: finalName,
          profilePicture: selectedAvatar,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to enter as guest. Please try again.');
        setIsLoading(false);
      } else {
        onLogin();
      }
    } catch {
      setError('Network error. Please ensure the backend server is running.');
      setIsLoading(false);
    }
  };

  const handleRandomizeName = () => {
    setGuestName(getRandomGuestName());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-primary/20 blur-[120px] animate-pulse delay-1000" />

      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-2xl flex items-center justify-center transform transition-transform hover:scale-105 shadow-xl border border-primary/20">
            <Coffee className="w-10 h-10 text-primary drop-shadow-md" />
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl bg-card/90 backdrop-blur-xl transition-all duration-300">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Campus Canteen
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Skip the line and order your favorites in seconds
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'guest' | 'member'); setError(''); }} className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-4 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="guest" className="rounded-lg font-semibold flex items-center gap-1.5 data-[state=active]:shadow-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Guest Login
                </TabsTrigger>
                <TabsTrigger value="member" className="rounded-lg font-semibold flex items-center gap-1.5 data-[state=active]:shadow-sm">
                  <UserCheck className="w-4 h-4" />
                  Student / Staff
                </TabsTrigger>
              </TabsList>

              {/* GUEST LOGIN TAB - Zero fuss, easy profile */}
              <TabsContent value="guest" className="space-y-4 mt-0">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="guestName" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                        Your Name / Nickname
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
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        id="guestName"
                        type="text"
                        placeholder="Enter your name or nickname"
                        className="pl-9 pr-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors text-sm font-medium"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        disabled={isLoading}
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
                </div>

                <Button
                  type="button"
                  onClick={() => handleGuestSubmit()}
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all gap-2 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entering Canteen...
                    </>
                  ) : (
                    <>
                      Enter Canteen as Guest <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
                
                <p className="text-[11px] text-center text-muted-foreground">
                  No password required • Ready to browse menu and order immediately
                </p>
              </TabsContent>

              {/* MEMBER LOGIN TAB */}
              <TabsContent value="member" className="space-y-4 mt-0">
                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-foreground/90 font-medium text-sm">
                      Username
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className="pl-9 bg-background/50 border-input hover:border-primary/50 focus:border-primary transition-colors text-sm"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-foreground/90 font-medium text-sm">
                        Password
                      </Label>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 bg-background/50 border-input hover:border-primary/50 focus:border-primary transition-colors text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 text-sm text-muted-foreground border-t border-border/50 pt-4 mt-2">
            <p>
              Want a permanent account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-primary hover:underline font-semibold"
              >
                Sign up
              </button>
            </p>
            {onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                Admin Portal
              </button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
