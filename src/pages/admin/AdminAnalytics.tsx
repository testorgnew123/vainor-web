import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Eye, ShoppingBag, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminStore, adminApiCall } from '@/stores/adminStore';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
  date: string;
  orders: number;
  revenue: string;
}

interface ProductSales {
  product_id: string;
  product_name: string;
  sku?: string;
  total_quantity: number;
  total_revenue: string;
}

interface ProductViews {
  product_id: string;
  product_name: string;
  sku?: string;
  view_count: number;
}

interface SubcategoryRevenue {
  subcategory: string;
  revenue: string;
}

export default function AdminAnalytics() {
  const { token } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [productViews, setProductViews] = useState<ProductViews[]>([]);
  const [subcategoryRevenue, setSubcategoryRevenue] = useState<SubcategoryRevenue[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalViews: 0,
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [revenueData, viewsData, subcatData] = await Promise.all([
        adminApiCall(`analytics/revenue?days=${period}`, { token: token! }),
        adminApiCall(`analytics/views?days=${period}`, { token: token! }),
        adminApiCall(`analytics/subcategory-revenue?days=${period}`, { token: token! }),
      ]);

      setSalesData(revenueData.daily || []);
      setProductSales(revenueData.byProduct || []);
      setProductViews(viewsData.products || []);
      setSubcategoryRevenue(subcatData.subcategories || []);

      // Calculate stats
      const totalRevenue = revenueData.daily?.reduce(
        (sum: number, d: SalesData) => sum + parseFloat(d.revenue), 0
      ) || 0;
      const totalOrders = revenueData.daily?.reduce(
        (sum: number, d: SalesData) => sum + parseInt(String(d.orders), 10), 0
      ) || 0;
      const totalViews = viewsData.products?.reduce(
        (sum: number, p: ProductViews) => sum + parseInt(String(p.view_count), 10), 0
      ) || 0;

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalViews,
      });
    } catch (error) {
      toast({
        title: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate percentage change (mock for now)
  const getChange = (value: number) => {
    const change = Math.random() * 20 - 5; // Mock random change
    return {
      value: change,
      isPositive: change > 0,
    };
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                <div className="flex items-center mt-1 text-sm">
                  {getChange(stats.totalRevenue).isPositive ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600">+{getChange(stats.totalRevenue).value.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-red-600">{getChange(stats.totalRevenue).value.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <div className="flex items-center mt-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">₹{stats.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <div className="flex items-center mt-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+5.2%</span>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Product Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <div className="flex items-center mt-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+18.3%</span>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="views">Product Views</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No sales data available</p>
              ) : (
                <div className="space-y-1">
                  {/* Simple bar chart representation */}
                  {(() => {
                    // Show number of bars based on selected period (max 14 for readability on longer periods)
                    const maxBars = parseInt(period) <= 14 ? parseInt(period) : 14;
                    const displayData = salesData.slice(-maxBars);
                    const maxRevenue = Math.max(...displayData.map(d => parseFloat(d.revenue)));
                    
                    return (
                      <>
                        <div className="flex items-end gap-1 h-48">
                          {displayData.map((day, index) => {
                            const height = maxRevenue > 0 ? (parseFloat(day.revenue) / maxRevenue) * 100 : 0;
                            return (
                              <div
                                key={index}
                                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors group relative"
                                style={{ height: `${Math.max(height, 2)}%` }}
                              >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                                  <p className="font-medium">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                  <p className="font-medium">₹{parseFloat(day.revenue).toLocaleString('en-IN')}</p>
                                  <p className="text-muted-foreground">{day.orders} orders</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex text-xs text-muted-foreground pt-2">
                          {displayData.map((day, i) => (
                            <span key={i} className="flex-1 text-center truncate px-0.5">
                              {new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {productSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No sales data available</p>
              ) : (
                <div className="space-y-4">
                  {productSales.slice(0, 10).map((product, index) => {
                    const maxRevenue = parseFloat(productSales[0]?.total_revenue || '1');
                    const percentage = (parseFloat(product.total_revenue) / maxRevenue) * 100;
                    return (
                      <div key={product.product_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                            <p className="font-medium">
                              {product.product_name}{product.sku && `-${product.sku}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{parseFloat(product.total_revenue).toLocaleString('en-IN')}</p>
                            <p className="text-sm text-muted-foreground">{product.total_quantity} sold</p>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views">
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Products</CardTitle>
            </CardHeader>
            <CardContent>
              {productViews.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No view data available</p>
              ) : (
                <div className="space-y-4">
                  {productViews.slice(0, 10).map((product, index) => {
                    const maxViews = productViews[0]?.view_count || 1;
                    const percentage = (product.view_count / maxViews) * 100;
                    return (
                      <div key={product.product_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                            <p className="font-medium">
                              {product.product_name}{product.sku && `-${product.sku}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{product.view_count.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">View to Cart Rate</span>
                <span className="font-medium">12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cart to Purchase Rate</span>
                <span className="font-medium">45.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Overall Conversion</span>
                <span className="font-medium">5.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Subcategory</CardTitle>
          </CardHeader>
          <CardContent>
            {subcategoryRevenue.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No data available</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-pink-500', 'bg-red-500', 'bg-gray-500'];
                  const totalRev = subcategoryRevenue.reduce((s, c) => s + parseFloat(c.revenue), 0);
                  return subcategoryRevenue.map((cat, i) => {
                    const pct = totalRev > 0 ? (parseFloat(cat.revenue) / totalRev) * 100 : 0;
                    return (
                      <div key={cat.subcategory} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                        <span className="flex-1">{cat.subcategory}</span>
                        <span className="font-medium">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
