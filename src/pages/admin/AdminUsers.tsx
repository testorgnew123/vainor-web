import { useEffect, useState } from 'react';
import { Search, Loader2, ShieldBan, ShieldCheck, Eye, Users, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAdminStore, adminApiCall } from '@/stores/adminStore';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  orders_count: string;
  total_spent: string;
  created_at: string;
}

interface UserOrder {
  id: string;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  items: any[] | null;
}

export default function AdminUsers() {
  const { token } = useAdminStore();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Block/unblock dialog
  const [blockDialog, setBlockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // User orders dialog
  const [ordersDialog, setOrdersDialog] = useState(false);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminApiCall('users', { token: token! });
      setUsers(data.users || []);
    } catch (error) {
      toast({
        title: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openBlockDialog = (user: UserData) => {
    setSelectedUser(user);
    setBlockDialog(true);
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const newBlockedState = !selectedUser.is_blocked;
      await adminApiCall(`users/${selectedUser.id}/block`, {
        method: 'PUT',
        token: token!,
        body: { is_blocked: newBlockedState },
      });

      toast({
        title: newBlockedState ? 'User blocked' : 'User unblocked',
      });
      setBlockDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Failed to update user',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openOrdersDialog = async (user: UserData) => {
    setSelectedUser(user);
    setOrdersDialog(true);
    setIsLoadingOrders(true);

    try {
      const data = await adminApiCall(`users/${user.id}/orders`, { token: token! });
      setUserOrders(data.orders || []);
    } catch (error) {
      toast({
        title: 'Failed to load user orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-blue-600';
      case 'processing': return 'text-purple-600';
      case 'shipped': return 'text-indigo-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'refunded': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      (user.first_name || '').toLowerCase().includes(search) ||
      (user.last_name || '').toLowerCase().includes(search) ||
      (user.phone || '').includes(search)
    );
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => !u.is_blocked).length,
    blocked: users.filter(u => u.is_blocked).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">User Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-3xl font-bold">{userStats.total}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <UserCheck className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{userStats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <UserX className="h-5 w-5 mx-auto mb-2 text-red-600" />
            <p className="text-3xl font-bold text-red-600">{userStats.blocked}</p>
            <p className="text-sm text-muted-foreground">Blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">
                            {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{user.orders_count}</TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(user.total_spent) > 0
                        ? `₹${parseFloat(user.total_spent).toLocaleString('en-IN')}`
                        : '₹0'}
                    </TableCell>
                    <TableCell>
                      {user.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrdersDialog(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Orders
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openBlockDialog(user)}
                          className={user.is_blocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                        >
                          {user.is_blocked ? (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <ShieldBan className="h-4 w-4 mr-1" />
                              Block
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Block/Unblock Confirmation Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_blocked ? 'Unblock User' : 'Block User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_blocked
                ? `Are you sure you want to unblock ${selectedUser?.email}? They will be able to log in and place orders again.`
                : `Are you sure you want to block ${selectedUser?.email}? They will not be able to log in or place orders.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_blocked ? 'default' : 'destructive'}
              onClick={handleToggleBlock}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : selectedUser?.is_blocked ? (
                'Unblock User'
              ) : (
                'Block User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Orders Dialog */}
      <Dialog open={ordersDialog} onOpenChange={setOrdersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Orders for {selectedUser?.first_name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>

          {isLoadingOrders ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders found for this user</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {userOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium font-mono text-sm">{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{parseFloat(order.total).toLocaleString('en-IN')}</p>
                      <Badge variant="outline" className={`${getStatusColor(order.status)} border-current`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrdersDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
