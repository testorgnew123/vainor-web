import { useEffect, useState } from 'react';
import { Package, AlertTriangle, ArrowUpDown, Search, Loader2, Plus, Minus } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAdminStore, adminApiCall } from '@/stores/adminStore';
import { cloudinaryUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku?: string;
  slug: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  images: string[];
}

interface InventoryLog {
  id: string;
  product_id: string;
  previous_quantity: number;
  new_quantity: number;
  change_type: string;
  reason: string;
  created_at: string;
  product_name?: string;
}

export default function AdminInventory() {
  const { token } = useAdminStore();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, lowStockData, logsData] = await Promise.all([
        adminApiCall('products', { token: token! }),
        adminApiCall('inventory/low-stock', { token: token! }),
        adminApiCall('inventory/log', { token: token! }),
      ]);

      setProducts(productsData.products || []);
      setLowStock(lowStockData.products || []);
      setLogs(logsData.logs || []);
    } catch (error) {
      toast({
        title: 'Failed to load inventory data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('add');
    setAdjustAmount(0);
    setAdjustReason('');
    setUpdateDialog(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    let quantityChange: number;
    switch (adjustType) {
      case 'add':
        quantityChange = adjustAmount;
        break;
      case 'remove':
        quantityChange = -adjustAmount;
        break;
      case 'set':
        quantityChange = adjustAmount - selectedProduct.stock_quantity;
        break;
    }

    setIsUpdating(true);

    try {
      await adminApiCall('inventory/update', {
        method: 'POST',
        token: token!,
        body: {
          product_id: selectedProduct.id,
          quantity_change: quantityChange,
          change_type: adjustType === 'add' ? 'restock' : 'adjustment',
          notes: adjustReason || `Stock ${adjustType} by ${adjustAmount}`,
        },
      });

      toast({ title: 'Stock updated successfully' });
      setUpdateDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Failed to update stock',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProducts = products
    .filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc'
          ? a.stock_quantity - b.stock_quantity
          : b.stock_quantity - a.stock_quantity;
      }
    });

  const toggleSort = (by: 'name' | 'stock') => {
    if (sortBy === by) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(by);
      setSortOrder('asc');
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge variant="outline" className="text-accent-warm border-accent-warm">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="text-success border-success">In Stock</Badge>;
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
      <h1 className="text-2xl font-display">Inventory Management</h1>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="border-accent/40 bg-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-accent-warm">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert ({lowStock.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.slice(0, 5).map(product => (
                <button
                  key={product.id}
                  onClick={() => openUpdateDialog(product)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border hover:border-foreground transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs font-mono text-muted-foreground">{product.sku}</span>
                    )}
                  </div>
                  <span className="text-sm text-destructive font-bold">{product.stock_quantity}</span>
                </button>
              ))}
              {lowStock.length > 5 && (
                <span className="text-sm text-muted-foreground self-center">
                  +{lowStock.length - 5} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <Package className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <Package className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + p.stock_quantity, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <AlertTriangle className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStock.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <Package className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stock_quantity === 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>All Products</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('stock')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Stock
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={cloudinaryUrl(product.images?.[0] || '/placeholder.jpg', { width: 200 })}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                  </TableCell>
                  <TableCell>
                    {product.sku && (
                      <span className="font-mono text-sm">{product.sku}</span>
                    )}
                  </TableCell>
                  <TableCell>₹{parseFloat(product.price).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="font-bold">{product.stock_quantity}</TableCell>
                  <TableCell>{getStockBadge(product.stock_quantity)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog(product)}
                    >
                      Update Stock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No inventory changes yet</p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{log.product_name || log.product_id}</p>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">
                      <span className="text-muted-foreground">{log.previous_quantity}</span>
                      {' → '}
                      <span className={log.new_quantity > log.previous_quantity ? 'text-success' : 'text-destructive'}>
                        {log.new_quantity}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Stock Dialog */}
      <Dialog open={updateDialog} onOpenChange={setUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Stock - {selectedProduct?.name}
              {selectedProduct?.sku && (
                <span className="text-sm font-mono text-muted-foreground ml-2">
                  ({selectedProduct.sku})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-4xl font-bold">{selectedProduct?.stock_quantity}</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustType === 'add' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustType('add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                type="button"
                variant={adjustType === 'remove' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustType('remove')}
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </Button>
              <Button
                type="button"
                variant={adjustType === 'set' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustType('set')}
              >
                Set
              </Button>
            </div>

            <div>
              <Label htmlFor="amount">Quantity</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., New shipment arrived, Inventory count correction..."
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">New Stock Level</p>
              <p className="text-2xl font-bold">
                {adjustType === 'add'
                  ? (selectedProduct?.stock_quantity || 0) + adjustAmount
                  : adjustType === 'remove'
                  ? Math.max(0, (selectedProduct?.stock_quantity || 0) - adjustAmount)
                  : adjustAmount}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
