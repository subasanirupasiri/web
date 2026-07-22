"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FolderOpen,
  Package,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loadCategories, saveCategories, loadItems, saveItems, loadMarkets, saveMarkets, generateId } from "@/lib/storage";
import type { Category, Item, MarketCenter } from "@/lib/types";
import { cn } from "@/lib/cn";

type AdminView = "categories" | "items" | "markets";

export function AdminPanel() {
  const [view, setView] = useState<AdminView>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [markets, setMarkets] = useState<MarketCenter[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Category form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", nameSi: "", emoji: "" });
  
  // Item form state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({ 
    categoryId: "", 
    name: "", 
    nameSi: "", 
    emoji: "", 
    unit: "kg",
    minPrice: "",
    maxPrice: ""
  });

  // Market form state
  const [editingMarket, setEditingMarket] = useState<MarketCenter | null>(null);
  const [marketForm, setMarketForm] = useState({ name: "", nameSi: "", district: "", emoji: "" });

  useEffect(() => {
    setCategories(loadCategories());
    setItems(loadItems());
    setMarkets(loadMarkets());
    setMounted(true);
  }, []);

  const persistCategories = useCallback((updated: Category[]) => {
    setCategories(updated);
    saveCategories(updated);
  }, []);

  const persistItems = useCallback((updated: Item[]) => {
    setItems(updated);
    saveItems(updated);
  }, []);

  const persistMarkets = useCallback((updated: MarketCenter[]) => {
    setMarkets(updated);
    saveMarkets(updated);
  }, []);

  const handleSaveCategory = () => {
    if (!categoryForm.name || !categoryForm.emoji) return;

    if (editingCategory) {
      persistCategories(
        categories.map((c) =>
          c.id === editingCategory.id
            ? { ...c, ...categoryForm }
            : c
        )
      );
    } else {
      const newCategory: Category = {
        id: generateId(),
        ...categoryForm,
      };
      persistCategories([...categories, newCategory]);
    }
    setEditingCategory(null);
    setCategoryForm({ name: "", nameSi: "", emoji: "" });
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Delete this category? All items in this category will also be deleted.")) {
      persistCategories(categories.filter((c) => c.id !== id));
      persistItems(items.filter((i) => i.categoryId !== id));
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, nameSi: category.nameSi, emoji: category.emoji });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", nameSi: "", emoji: "" });
  };

  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.emoji || !itemForm.categoryId) return;

    const minPrice = itemForm.minPrice ? parseFloat(itemForm.minPrice) : undefined;
    const maxPrice = itemForm.maxPrice ? parseFloat(itemForm.maxPrice) : undefined;

    if (editingItem) {
      persistItems(
        items.map((i) =>
          i.id === editingItem.id
            ? { ...i, ...itemForm, minPrice, maxPrice }
            : i
        )
      );
    } else {
      const newItem: Item = {
        id: generateId(),
        ...itemForm,
        minPrice,
        maxPrice,
      };
      persistItems([...items, newItem]);
    }
    setEditingItem(null);
    setItemForm({ categoryId: "", name: "", nameSi: "", emoji: "", unit: "kg", minPrice: "", maxPrice: "" });
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Delete this item?")) {
      persistItems(items.filter((i) => i.id !== id));
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setItemForm({ 
      categoryId: item.categoryId,
      name: item.name, 
      nameSi: item.nameSi, 
      emoji: item.emoji, 
      unit: item.unit,
      minPrice: item.minPrice?.toString() || "",
      maxPrice: item.maxPrice?.toString() || ""
    });
  };

  const handleCancelItemEdit = () => {
    setEditingItem(null);
    setItemForm({ categoryId: "", name: "", nameSi: "", emoji: "", unit: "kg", minPrice: "", maxPrice: "" });
  };

  const handleSaveMarket = () => {
    if (!marketForm.name || !marketForm.district || !marketForm.emoji) return;

    if (editingMarket) {
      persistMarkets(
        markets.map((m) =>
          m.id === editingMarket.id
            ? { ...m, ...marketForm }
            : m
        )
      );
    } else {
      const newMarket: MarketCenter = {
        id: generateId(),
        ...marketForm,
      };
      persistMarkets([...markets, newMarket]);
    }
    setEditingMarket(null);
    setMarketForm({ name: "", nameSi: "", district: "", emoji: "" });
  };

  const handleDeleteMarket = (id: string) => {
    if (confirm("Delete this market? All price data for this market will also be deleted.")) {
      persistMarkets(markets.filter((m) => m.id !== id));
    }
  };

  const handleEditMarket = (market: MarketCenter) => {
    setEditingMarket(market);
    setMarketForm({ name: market.name, nameSi: market.nameSi, district: market.district, emoji: market.emoji });
  };

  const handleCancelMarketEdit = () => {
    setEditingMarket(null);
    setMarketForm({ name: "", nameSi: "", district: "", emoji: "" });
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-muted">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
          <p className="text-sm text-text-muted">Manage categories and items</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "categories" ? "primary" : "outline"}
            onClick={() => setView("categories")}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Categories
          </Button>
          <Button
            variant={view === "items" ? "primary" : "outline"}
            onClick={() => setView("items")}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Items
          </Button>
          <Button
            variant={view === "markets" ? "primary" : "outline"}
            onClick={() => setView("markets")}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Markets
          </Button>
        </div>
      </div>

      {view === "categories" ? (
        <div className="space-y-6">
          {/* Add/Edit Category Form */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Vegetables"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Sinhala Name</label>
                <input
                  type="text"
                  value={categoryForm.nameSi}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameSi: e.target.value })}
                  placeholder="e.g., එළවළු"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Emoji</label>
                <input
                  type="text"
                  value={categoryForm.emoji}
                  onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })}
                  placeholder="e.g., 🥬"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveCategory} disabled={!categoryForm.name || !categoryForm.emoji}>
                <Save className="h-4 w-4" />
                {editingCategory ? "Update" : "Add"} Category
              </Button>
              {editingCategory && (
                <Button variant="outline" onClick={handleCancelCategoryEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </Card>

          {/* Categories List */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.emoji}</span>
                    <div>
                      <p className="font-semibold text-text">{category.name}</p>
                      <p className="text-sm text-text-muted">{category.nameSi}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {items.filter((i) => i.categoryId === category.id).length} items
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add/Edit Item Form */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g., Beans"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Sinhala Name</label>
                <input
                  type="text"
                  value={itemForm.nameSi}
                  onChange={(e) => setItemForm({ ...itemForm, nameSi: e.target.value })}
                  placeholder="e.g., බෝංචි"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Emoji</label>
                <input
                  type="text"
                  value={itemForm.emoji}
                  onChange={(e) => setItemForm({ ...itemForm, emoji: e.target.value })}
                  placeholder="e.g., 🫘"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Unit</label>
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="kg">kg</option>
                  <option value="piece">piece</option>
                  <option value="bunch">bunch</option>
                  <option value="pack">pack</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Min Price (Rs.)</label>
                <input
                  type="number"
                  value={itemForm.minPrice}
                  onChange={(e) => setItemForm({ ...itemForm, minPrice: e.target.value })}
                  placeholder="e.g., 200"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Max Price (Rs.)</label>
                <input
                  type="number"
                  value={itemForm.maxPrice}
                  onChange={(e) => setItemForm({ ...itemForm, maxPrice: e.target.value })}
                  placeholder="e.g., 250"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveItem} disabled={!itemForm.name || !itemForm.emoji || !itemForm.categoryId}>
                <Save className="h-4 w-4" />
                {editingItem ? "Update" : "Add"} Item
              </Button>
              {editingItem && (
                <Button variant="outline" onClick={handleCancelItemEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </Card>

          {/* Items by Category */}
          {categories.map((category) => {
            const categoryItems = items.filter((i) => i.categoryId === category.id);
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <h3 className="text-lg font-semibold text-text">{category.name}</h3>
                  <span className="text-sm text-text-muted">({category.nameSi})</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <p className="font-semibold text-text">{item.name}</p>
                            <p className="text-sm text-text-muted">{item.nameSi}</p>
                            <p className="mt-1 text-xs text-text-muted">
                              Unit: {item.unit}
                              {item.minPrice && item.maxPrice && (
                                <span className="ml-2">
                                  Price: Rs. {item.minPrice} - {item.maxPrice}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          
          {items.length === 0 && (
            <Card className="flex flex-col items-center py-12 text-center">
              <Package className="h-12 w-12 text-text-muted mb-3" />
              <p className="font-semibold text-text">No items yet</p>
              <p className="mt-1 text-sm text-text-muted">
                Add your first item using the form above
              </p>
            </Card>
          )}
        </div>
      )}

      {view === "markets" && (
        <div className="space-y-6">
          {/* Add/Edit Market Form */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text">
              {editingMarket ? "Edit Market" : "Add New Market"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Market Name</label>
                <input
                  type="text"
                  value={marketForm.name}
                  onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })}
                  placeholder="e.g., Dambulla Economic Centre"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Sinhala Name</label>
                <input
                  type="text"
                  value={marketForm.nameSi}
                  onChange={(e) => setMarketForm({ ...marketForm, nameSi: e.target.value })}
                  placeholder="e.g., Dambulla Arthika Madhyasthanaya"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">District</label>
                <input
                  type="text"
                  value={marketForm.district}
                  onChange={(e) => setMarketForm({ ...marketForm, district: e.target.value })}
                  placeholder="e.g., Matale"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Emoji</label>
                <input
                  type="text"
                  value={marketForm.emoji}
                  onChange={(e) => setMarketForm({ ...marketForm, emoji: e.target.value })}
                  placeholder="e.g., 🏛️"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveMarket} disabled={!marketForm.name || !marketForm.district || !marketForm.emoji}>
                <Save className="h-4 w-4" />
                {editingMarket ? "Update" : "Add"} Market
              </Button>
              {editingMarket && (
                <Button variant="outline" onClick={handleCancelMarketEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </Card>

          {/* Markets List */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => (
              <Card key={market.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{market.emoji}</span>
                    <div>
                      <p className="font-semibold text-text">{market.name}</p>
                      <p className="text-sm text-text-muted">{market.nameSi}</p>
                      <p className="mt-1 text-xs text-text-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {market.district}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMarket(market)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMarket(market.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {markets.length === 0 && (
            <Card className="flex flex-col items-center py-12 text-center">
              <MapPin className="h-12 w-12 text-text-muted mb-3" />
              <p className="font-semibold text-text">No markets yet</p>
              <p className="mt-1 text-sm text-text-muted">
                Add your first market using the form above
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
