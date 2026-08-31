"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  DollarSign,
  User,
  Sparkles,
  ArrowLeft,
  Save,
  Check,
} from "lucide-react";
import {
  PropertyDetail,
  PropertyFormData,
  PropertyType,
  ListingType,
  PropertyStatus,
  SizeUnit,
  Amenity,
  createProperty,
  updateProperty,
  fetchAmenities,
} from "@/lib/properties";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export interface PropertyFormProps {
  initialData?: PropertyDetail;
  isEditMode?: boolean;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    property_type: (initialData?.property_type as PropertyType) || "residential",
    listing_type: (initialData?.listing_type as ListingType) || "sale",
    status: (initialData?.status as PropertyStatus) || "available",
    address: initialData?.address || "",
    city: initialData?.city || "Islamabad",
    locality: initialData?.locality || "",
    postal_code: initialData?.postal_code || "",
    latitude: initialData?.latitude ? String(initialData.latitude) : "",
    longitude: initialData?.longitude ? String(initialData.longitude) : "",
    size: initialData?.size || "",
    size_unit: (initialData?.size_unit as SizeUnit) || "marla",
    price: initialData?.price || "",
    owner_name: initialData?.owner_name || "",
    owner_contact: initialData?.owner_contact || "",
    owner_email: initialData?.owner_email || "",
    amenity_ids: initialData?.amenities?.map((a) => a.id) || [],
  });

  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchAmenities()
      .then((amenities) => {
        setAvailableAmenities(amenities);
      })
      .catch(() => {});
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Property title is required.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    const numPrice = Number(formData.price);
    if (!formData.price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = "Price must be a positive number greater than zero.";
    }

    const numSize = Number(formData.size);
    if (!formData.size || isNaN(numSize) || numSize <= 0) {
      newErrors.size = "Size must be a positive number greater than zero.";
    }

    if (
      formData.owner_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)
    ) {
      newErrors.owner_email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please correct the highlighted fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && initialData) {
        await updateProperty(initialData.id, formData);
        showToast({
          type: "success",
          title: "Property Updated",
          message: "Listing changes saved successfully.",
        });
        router.push(`/properties/${initialData.id}`);
      } else {
        const created = await createProperty(formData);
        showToast({
          type: "success",
          title: "Property Created",
          message: `Listing "${created.title}" successfully added.`,
        });
        router.push(`/properties/${created.id}`);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to save property. Please check inputs.";
      showToast({
        type: "error",
        title: "Submission Error",
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    const current = formData.amenity_ids || [];
    if (current.includes(amenityId)) {
      setFormData({
        ...formData,
        amenity_ids: current.filter((id) => id !== amenityId),
      });
    } else {
      setFormData({
        ...formData,
        amenity_ids: [...current, amenityId],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {isEditMode ? "Edit Property Listing" : "Add New Property Listing"}
        </h2>
        <Button
          type="submit"
          variant="gold"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditMode ? "Save Changes" : "Publish Listing"}
        </Button>
      </div>

      {/* 1. Basic Information */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <Building2 className="w-4 h-4 text-amber-400" />
            Listing Information
          </CardTitle>
          <CardDescription>
            Specify the property title, classification, and transaction terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Property Title *"
            placeholder="e.g. Luxury 1 Kanal Modern Villa with Hill View"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            error={errors.title}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Property Type *"
              value={formData.property_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  property_type: e.target.value as PropertyType,
                })
              }
              options={[
                { value: "residential", label: "Residential" },
                { value: "commercial", label: "Commercial" },
                { value: "plot", label: "Plot / Land" },
                { value: "rental", label: "Rental Residence" },
              ]}
            />

            <Select
              label="Listing Type *"
              value={formData.listing_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  listing_type: e.target.value as ListingType,
                })
              }
              options={[
                { value: "sale", label: "For Sale" },
                { value: "rent", label: "For Rent / Lease" },
              ]}
            />

            <Select
              label="Listing Status *"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as PropertyStatus,
                })
              }
              options={[
                { value: "available", label: "Available" },
                { value: "under_negotiation", label: "Under Negotiation" },
                { value: "sold", label: "Sold" },
                { value: "rented", label: "Rented" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description / Marketing Remarks
            </label>
            <textarea
              rows={4}
              placeholder="Describe the architectural style, flooring, fixtures, nearby schools/highways, and unique selling points..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-slate-900/80 text-slate-100 text-sm rounded-xl border border-slate-800 p-3.5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Pricing & Dimensions */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Pricing & Property Dimensions
          </CardTitle>
          <CardDescription>
            Specify asking price and precise physical dimensions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Price (PKR) *"
            type="number"
            placeholder="e.g. 85000000"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            error={errors.price}
            required
          />

          <Input
            label="Size / Area *"
            type="number"
            step="0.01"
            placeholder="e.g. 20"
            value={formData.size}
            onChange={(e) =>
              setFormData({ ...formData, size: e.target.value })
            }
            error={errors.size}
            required
          />

          <Select
            label="Size Unit *"
            value={formData.size_unit}
            onChange={(e) =>
              setFormData({
                ...formData,
                size_unit: e.target.value as SizeUnit,
              })
            }
            options={[
              { value: "marla", label: "Marla (Pakistani Unit)" },
              { value: "kanal", label: "Kanal (20 Marla)" },
              { value: "sq_yd", label: "Square Yards (Sq Yd)" },
              { value: "sq_ft", label: "Square Feet (Sq Ft)" },
            ]}
          />
        </CardContent>
      </Card>

      {/* 3. Location Details */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <MapPin className="w-4 h-4 text-sky-400" />
            Location & Address
          </CardTitle>
          <CardDescription>
            Address, locality/sub-sector, and coordinates for location mapping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City *"
              placeholder="e.g. Islamabad, Lahore, Karachi"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              error={errors.city}
              required
            />

            <Input
              label="Locality / Sector"
              placeholder="e.g. Sector F-7/2, DHA Phase 5, Bahria Town"
              value={formData.locality}
              onChange={(e) =>
                setFormData({ ...formData, locality: e.target.value })
              }
            />
          </div>

          <Input
            label="Street Address *"
            placeholder="e.g. House 42, Street 18, Main Boulevard"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={errors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Postal Code"
              placeholder="e.g. 44000"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
            />

            <Input
              label="Latitude (Optional)"
              placeholder="e.g. 33.7294"
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
            />

            <Input
              label="Longitude (Optional)"
              placeholder="e.g. 73.0931"
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Amenities Multi-Select */}
      {availableAmenities.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>
              <Sparkles className="w-4 h-4 text-amber-400" />
              Property Amenities & Features
            </CardTitle>
            <CardDescription>
              Select all amenities available at this property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {availableAmenities.map((amenity) => {
                const isSelected = (formData.amenity_ids || []).includes(
                  amenity.id
                );
                return (
                  <button
                    type="button"
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all text-left ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/20"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span>{amenity.name}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Owner / Landlord Details */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <User className="w-4 h-4 text-purple-400" />
            Owner / Seller Contact Information
          </CardTitle>
          <CardDescription>
            Internal agency record of the property owner for negotiations and contract signing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Owner Name"
            placeholder="e.g. Malik Riaz"
            value={formData.owner_name}
            onChange={(e) =>
              setFormData({ ...formData, owner_name: e.target.value })
            }
          />

          <Input
            label="Owner Contact Phone"
            placeholder="e.g. +92-300-1122334"
            value={formData.owner_contact}
            onChange={(e) =>
              setFormData({ ...formData, owner_contact: e.target.value })
            }
          />

          <Input
            label="Owner Email"
            type="email"
            placeholder="e.g. owner@gmail.com"
            value={formData.owner_email}
            onChange={(e) =>
              setFormData({ ...formData, owner_email: e.target.value })
            }
            error={errors.owner_email}
          />
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gold"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditMode ? "Save Changes" : "Create Listing"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
