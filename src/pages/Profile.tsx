import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, MapPin, Star } from 'lucide-react';
import { useAuth, updateAuthUser } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Address {
  id: string;
  label: string;
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && token) {
      fetchAddresses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const result = await apiCall('addresses', { action: 'list' }, { token: token! });
      setAddresses(result.data || []);
    } catch {
      // non-fatal
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiCall('addresses', { action: 'set_default', id }, { token: token! });
      setAddresses(addresses.map(addr => ({ ...addr, is_default: addr.id === id })));
      toast({ title: 'Default Address Updated', description: 'Your default address has been changed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update default address', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiCall('update-profile', {
        first_name: firstName,
        last_name: lastName,
        phone,
      }, { token: token! });

      updateAuthUser({ first_name: firstName, last_name: lastName, phone });

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12 max-w-2xl">
        <Link
          to="/account"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <h1 className="font-display text-3xl md:text-4xl mb-8">Profile Settings</h1>

        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Addresses Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">My Addresses</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/addresses">Manage Addresses</Link>
            </Button>
          </div>

          {addressesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No addresses saved yet.</p>
              <Button variant="link" size="sm" asChild className="mt-2">
                <Link to="/addresses">Add your first address</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`bg-card border rounded-lg p-4 ${
                    address.is_default ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{address.label}</span>
                        {address.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{address.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}, {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                    </div>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
