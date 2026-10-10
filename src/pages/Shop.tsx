import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronDown, X, Grid, LayoutGrid, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Popular', value: 'popular' },
];

const priceRanges = [
  { label: 'Under ₹2,500', min: 0, max: 2500 },
  { label: '₹2,500 - ₹10,000', min: 2500, max: 10000 },
  { label: '₹10,000 - ₹25,000', min: 10000, max: 25000 },
  { label: 'Over ₹25,000', min: 25000, max: Infinity },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colors = ['White', 'Black', 'Grey', 'Navy', 'Cream', 'Camel', 'Brown'];

export default function Shop() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const searchParam = searchParams.get('search');
  const subcategoryParam = searchParams.get('subcategory');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 4>(4);

  // Filters
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subcategoryParam);

  // Sync subcategory filter when URL param changes (e.g. clicking nav links)
  useEffect(() => {
    setSelectedSubcategory(subcategoryParam);
  }, [subcategoryParam]);

  // Fetch products from API + static fallback
  const { products, isLoading } = useProducts({ 
    category, 
    search: searchParam || undefined 
  });

  const currentCategory = categories.find(
    (c) => c.id.toLowerCase() === category?.toLowerCase()
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply subcategory filter
    if (selectedSubcategory) {
      result = result.filter(p => 
        p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    // Apply price range filter
    if (selectedPriceRange) {
      result = result.filter(p => 
        p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max
      );
    }

    // Apply size filter
    if (selectedSizes.length > 0) {
      result = result.filter(p => 
        p.sizes?.some(s => selectedSizes.includes(s))
      );
    }

    // Apply color filter
    if (selectedColors.length > 0) {
      result = result.filter(p => 
        p.colors?.some(c => selectedColors.includes(c.name))
      );
    }

    // Apply special filters
    if (filterParam === 'new') {
      result = result.filter((p) => p.isNew);
    } else if (filterParam === 'featured') {
      result = result.filter((p) => p.isFeatured);
    } else if (filterParam === 'sale') {
      result = result.filter((p) => p.originalPrice);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      default:
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [products, selectedSubcategory, selectedPriceRange, selectedSizes, selectedColors, sortBy, filterParam]);

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRange(null);
    setSelectedSubcategory(null);
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedPriceRange || selectedSubcategory;

  const pageTitle = category
    ? currentCategory?.name || 'Shop'
    : searchParam
    ? `Search: "${searchParam}"`
    : subcategoryParam
    ? subcategoryParam
    : filterParam === 'new'
    ? 'New Arrivals'
    : filterParam === 'featured'
    ? 'Featured'
    : filterParam === 'sale'
    ? 'Sale'
    : 'All Products';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-secondary/30 py-12 md:py-16">
        <div className="container">
          <h1 className="font-display text-4xl md:text-5xl mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products
          </p>
        </div>
      </section>

      <div className="container py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {/* Desktop Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="hidden md:flex"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Grid Toggle */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setGridCols(2)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  gridCols === 2 ? 'bg-secondary' : 'hover:bg-secondary/50'
                )}
                aria-label="2 columns"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  gridCols === 4 ? 'bg-secondary' : 'hover:bg-secondary/50'
                )}
                aria-label="4 columns"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                Sort by: {sortOptions.find((o) => o.value === sortBy)?.label}
                <ChevronDown className={cn('h-4 w-4 ml-2 transition-transform', isSortOpen && 'rotate-180')} />
              </Button>
              
              {isSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSortOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-20 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors',
                          sortBy === option.value && 'bg-secondary font-medium'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside
            className={cn(
              'hidden md:block w-64 flex-shrink-0 transition-all duration-300',
              !isFilterOpen && 'w-0 overflow-hidden'
            )}
          >
            <div className="sticky top-24 space-y-6">
              {/* Subcategories */}
              {currentCategory && (
                <div>
                  <h3 className="font-medium mb-3">Category</h3>
                  <div className="space-y-2">
                    {currentCategory.subcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() =>
                          setSelectedSubcategory(
                            selectedSubcategory === sub ? null : sub
                          )
                        }
                        className={cn(
                          'block text-sm transition-colors',
                          selectedSubcategory === sub
                            ? 'text-accent font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <h3 className="font-medium mb-3">Price</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() =>
                        setSelectedPriceRange(
                          selectedPriceRange?.min === range.min ? null : range
                        )
                      }
                      className={cn(
                        'block text-sm transition-colors',
                        selectedPriceRange?.min === range.min
                          ? 'text-accent font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <h3 className="font-medium mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSizes(
                          selectedSizes.includes(size)
                            ? selectedSizes.filter((s) => s !== size)
                            : [...selectedSizes, size]
                        )
                      }
                      className={cn(
                        'px-3 py-1.5 text-sm border rounded-md transition-colors',
                        selectedSizes.includes(size)
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border hover:border-foreground'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <h3 className="font-medium mb-3">Color</h3>
                <div className="space-y-2">
                  {colors.map((color) => (
                    <label
                      key={color}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedColors.includes(color)}
                        onCheckedChange={(checked) =>
                          setSelectedColors(
                            checked
                              ? [...selectedColors, color]
                              : selectedColors.filter((c) => c !== color)
                          )
                        }
                      />
                      <span className="text-sm">{color}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  No products found matching your criteria.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-4 md:gap-6',
                  gridCols === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                )}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity duration-300',
          isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-foreground/60"
          onClick={() => setIsFilterOpen(false)}
        />
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 max-h-[80vh] bg-background rounded-t-2xl transition-transform duration-300 overflow-y-auto',
            isFilterOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Mobile filter content - similar to desktop */}
              {currentCategory && (
                <div>
                  <h3 className="font-medium mb-3">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCategory.subcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() =>
                          setSelectedSubcategory(
                            selectedSubcategory === sub ? null : sub
                          )
                        }
                        className={cn(
                          'px-3 py-1.5 text-sm border rounded-full transition-colors',
                          selectedSubcategory === sub
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-3">Price</h3>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() =>
                        setSelectedPriceRange(
                          selectedPriceRange?.min === range.min ? null : range
                        )
                      }
                      className={cn(
                        'px-3 py-1.5 text-sm border rounded-full transition-colors',
                        selectedPriceRange?.min === range.min
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSizes(
                          selectedSizes.includes(size)
                            ? selectedSizes.filter((s) => s !== size)
                            : [...selectedSizes, size]
                        )
                      }
                      className={cn(
                        'px-3 py-1.5 text-sm border rounded-full transition-colors',
                        selectedSizes.includes(size)
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                Clear All
              </Button>
              <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                View {filteredProducts.length} Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
