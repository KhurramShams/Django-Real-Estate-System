"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  PropertyListItem,
  PaginatedPropertiesResponse,
  fetchProperties,
  PropertyStatus,
  PropertyType,
  ListingType,
} from "@/lib/properties";

export default function PropertiesListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";

  // View state: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Query and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minSize, setMinSize] = useState<string>("");
  const [maxSize, setMaxSize] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<PaginatedPropertiesResponse | null>(null);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProperties({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        property_type: typeFilter || undefined,
        listing_type: listingTypeFilter || undefined,
        city: cityFilter || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        min_size: minSize || undefined,
        max_size: maxSize || undefined,
        page: currentPage,
      });
      setData(response);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Load Error",
        message: err?.message || "Failed to load properties.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    typeFilter,
    listingTypeFilter,
    cityFilter,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    currentPage,
    showToast,
  ]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setListingTypeFilter("");
    setCityFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinSize("");
    setMaxSize("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(statusFilter) ||
    Boolean(typeFilter) ||
    Boolean(listingTypeFilter) ||
    Boolean(cityFilter) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(minSize) ||
    Boolean(maxSize);

  const formatPrice = (priceStr: string) => {
    const num = Number(priceStr);
    if (isNaN(num)) return `PKR ${priceStr}`;
    if (num >= 10000000) {
      return `PKR ${(num / 10000000).toFixed(2)} Crore`;
    }
    if (num >= 100000) {
      return `PKR ${(num / 100000).toFixed(2)} Lakh`;
    }
    return `PKR ${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-400" />
            Property Listings Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {data ? `${data.count} properties registered across the agency` : "Loading listing inventory..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Property Button (ADMIN/AGENT Only) */}
          {isEditor && (
            <Link href="/properties/new">
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Property
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card variant="glass">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 w-full">
              <Input
                placeholder="Search listings by title, sector, address, or owner..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters || hasActiveFilters ? "gold" : "secondary"}
              size="md"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters {hasActiveFilters && "(Active)"}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleClearFilters}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "available", label: "Available" },
                  { value: "under_negotiation", label: "Under Negotiation" },
                  { value: "sold", label: "Sold" },
                  { value: "rented", label: "Rented" },
                ]}
              />

              <Select
                label="Property Type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Types" },
                  { value: "residential", label: "Residential" },
                  { value: "commercial", label: "Commercial" },
                  { value: "plot", label: "Plot / Land" },
                  { value: "rental", label: "Rental Residence" },
                ]}
              />

              <Select
                label="Listing Type"
                value={listingTypeFilter}
                onChange={(e) => {
                  setListingTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Listings" },
                  { value: "sale", label: "For Sale" },
                  { value: "rent", label: "For Rent" },
                ]}
              />

              <Input
                label="City"
                placeholder="e.g. Islamabad"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Min Price (PKR)"
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Max Price (PKR)"
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Min Size"
                type="number"
                placeholder="Min Size"
                value={minSize}
                onChange={(e) => {
                  setMinSize(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Max Size"
                type="number"
                placeholder="Max Size"
                value={maxSize}
                onChange={(e) => {
                  setMaxSize(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton rows={6} cols={6} />
        )
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No Properties Found"
          description={
            hasActiveFilters
              ? "No property listings match your selected search or filter parameters. Try clearing your filters."
              : "No property listings have been added yet. Start by publishing your first property."
          }
          actionLabel={hasActiveFilters ? "Clear All Filters" : isEditor ? "Add Property" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : isEditor ? () => (window.location.href = "/properties/new") : undefined}
        />
      ) : viewMode === "grid" ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.results.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="group block">
              <Card variant="glass" className="h-full flex flex-col overflow-hidden group-hover:border-amber-500/50 transition-all duration-200">
                {/* Cover Image */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  {property.primary_image_url ? (
                    <img
                      src={property.primary_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600">
                      <Building2 className="w-12 h-12 mb-1 opacity-50" />
                      <span className="text-[11px] font-medium">No Image Uploaded</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant={property.status} />
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                      {property.listing_type_display}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
                      <span>{property.property_type_display}</span>
                      <span>•</span>
                      <span className="text-slate-400">{property.size} {property.size_unit_display}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{property.address}, {property.city}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Asking Price</span>
                      <span className="text-base font-bold text-emerald-400 tracking-tight">
                        {formatPrice(property.price)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Table View */
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                      {property.primary_image_url ? (
                        <img
                          src={property.primary_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/properties/${property.id}`}
                        className="font-bold text-white hover:text-amber-300 transition-colors block max-w-xs truncate"
                      >
                        {property.title}
                      </Link>
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                        {property.listing_type_display}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-300 font-medium">
                    {property.property_type_display}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {property.city}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-300 font-medium">
                    {property.size} {property.size_unit_display}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={property.status} size="sm" />
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatPrice(property.price)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/properties/${property.id}`}>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination Controls */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing Page <strong className="text-white">{data.current_page}</strong> of{" "}
            <strong className="text-white">{data.total_pages}</strong> ({data.count} Total Listings)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              disabled={data.current_page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              disabled={data.current_page >= data.total_pages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
