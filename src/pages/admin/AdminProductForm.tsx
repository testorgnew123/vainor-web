import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStore, adminApiCall } from '@/stores/adminStore';
import { useToast } from '@/hooks/use-toast';
import { cloudinaryUrl } from '@/lib/utils';

interface ProductForm {
  name: string;
  sku: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  subcategory: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
}

const initialForm: ProductForm = {
  name: '',
  sku: '',
  slug: '',
  description: '',
  price: 0,
  original_price: null,
  category_id: '',
  subcategory: '',
  images: [],
  sizes: [],
  colors: [],
  stock_quantity: 0,
  is_active: true,
  is_featured: false,
  is_new: false,
};

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44'];
const subcategories = ['Jeans', 'Shirts', 'Trousers', 'Cargo', 'Lowers', 'T-Shirt'];

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAdminStore();
  const { toast } = useToast();

  const isEditing = id && id !== 'new';
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const data = await adminApiCall('categories', { token: token! });
      setDbCategories(data.categories || []);
    } catch {
      // Categories may not be set up yet, ignore
    }
  };

  const fetchProduct = async () => {
    try {
      const data = await adminApiCall('products', { token: token! });
      const product = data.products.find((p: any) => p.id === id);
      if (product) {
        setForm({
          name: product.name,
          sku: product.sku || '',
          slug: product.slug,
          description: product.description || '',
          price: parseFloat(product.price),
          original_price: product.original_price ? parseFloat(product.original_price) : null,
          category_id: product.category_id || '',
          subcategory: product.subcategory || '',
          images: product.images || [],
          sizes: product.sizes || [],
          colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors || [],
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          is_featured: product.is_featured,
          is_new: product.is_new,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()],
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const compressImage = (file: File, maxBytes = 10 * 1024 * 1024): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (file.size <= maxBytes) {
        resolve(file);
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0);

        // Binary-search for the highest quality that keeps the file under maxBytes
        let lo = 0.5, hi = 0.95, best: Blob | null = null;
        const tryQuality = (q: number): Promise<Blob> =>
          new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', q));

        const search = async () => {
          // First try high quality
          let blob = await tryQuality(hi);
          if (blob.size <= maxBytes) { best = blob; }
          else {
            // Binary search between lo and hi
            for (let iter = 0; iter < 8; iter++) {
              const mid = (lo + hi) / 2;
              blob = await tryQuality(mid);
              if (blob.size <= maxBytes) { best = blob; lo = mid; }
              else { hi = mid; }
            }
          }
          if (!best) {
            // If still too large, do one more pass at lo quality
            best = await tryQuality(lo);
          }
          const compressed = new File([best], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(compressed);
        };
        search().catch(reject);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  };

  const uploadToCloudinary = async (files: FileList) => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Get signature from backend
      const sigRes = await fetch('/.netlify/functions/cloudinary-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!sigRes.ok) throw new Error('Failed to get upload signature');
      const { signature, timestamp, cloud_name, api_key, folder } = await sigRes.json();

      for (let i = 0; i < files.length; i++) {
        const file = await compressImage(files[i]);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        const result: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: Math.round((e.loaded / e.total) * 100),
              }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
            else reject(new Error(`Upload failed for ${file.name}`));
          };
          xhr.onerror = () => reject(new Error(`Upload failed for ${file.name}`));
          xhr.send(formData);
        });

        uploadedUrls.push(result.secure_url);
      }

      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      toast({ title: `${uploadedUrls.length} image(s) uploaded successfully` });
    } catch (error: any) {
      toast({
        title: 'Failed to upload images',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const toggleSize = (size: string) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const addColor = () => {
    if (newColorName.trim()) {
      setForm(prev => ({
        ...prev,
        colors: [...prev.colors, { name: newColorName.trim(), hex: newColorHex }],
      }));
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const removeColor = (index: number) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.sku || !form.slug || form.price <= 0) {
      toast({
        title: 'Please fill required fields',
        description: 'Name, SKU, slug, and price are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing) {
        await adminApiCall(`products/${id}`, {
          method: 'PUT',
          token: token!,
          body: form,
        });
        toast({ title: 'Product updated successfully' });
      } else {
        await adminApiCall('products', {
          method: 'POST',
          token: token!,
          body: form,
        });
        toast({ title: 'Product created successfully' });
      }
      navigate('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Failed to save product',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/products')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <h1 className="text-2xl font-display mb-6">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Oversized Linen Blazer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder="SKU-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="oversized-linen-blazer"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description..."
                className="mt-1"
                rows={4}
              />
            </div>

            {dbCategories.length > 0 && (
              <div>
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  value={form.category_id}
                  onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {dbCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <select
                id="subcategory"
                value={form.subcategory}
                onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="1999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="original_price">Original Price (₹)</Label>
                <Input
                  id="original_price"
                  type="number"
                  value={form.original_price || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, original_price: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="2499"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File upload area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && uploadToCloudinary(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Uploading...' : 'Click to upload images'}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, WebP — multiple files supported
                </span>
              </label>
            </div>

            {/* Upload progress */}
            {Object.entries(uploadProgress).map(([name, progress]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm truncate flex-1">{name}</span>
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{progress}%</span>
              </div>
            ))}

            {/* URL input fallback */}
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste image URL..."
                className="flex-1"
              />
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Image previews */}
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={cloudinaryUrl(img, { width: 200 })}
                      alt={`Product ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    form.sizes.includes(size)
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border hover:border-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name"
                className="flex-1"
              />
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-12 h-10 rounded border border-border cursor-pointer"
              />
              <Button type="button" onClick={addColor} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">Product is visible on the store</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Featured</p>
                <p className="text-sm text-muted-foreground">Show on homepage</p>
              </div>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Arrival</p>
                <p className="text-sm text-muted-foreground">Display "New" badge</p>
              </div>
              <Switch
                checked={form.is_new}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_new: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Product' : 'Create Product'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
