"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Maximize2,
  DollarSign,
  User,
  Phone,
  Mail,
  Edit,
  Trash2,
  Upload,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Star,
  X,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PropertyDetail,
  fetchProperty,
  deleteProperty,
  uploadPropertyImage,
  deletePropertyImage,
  setPrimaryPropertyImage,
} from "@/lib/properties";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  const loadProperty = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProperty(propertyId);
      setProperty(data);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Load Error",
        message: err?.message || "Failed to load property details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, showToast]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const handleDeleteProperty = async () => {
    setIsDeleting(true);
    try {
      await deleteProperty(propertyId);
      showToast({
        type: "success",
        title: "Property Deleted",
        message: "The listing has been permanently removed.",
      });
      router.push("/properties");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err?.message || "Failed to delete property.",
      });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size and format
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WEBP formats are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size must not exceed 10 MB.");
      return;
    }

    setUploadError("");
    setUploadFile(file);
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", uploadFile);
      if (uploadCaption) {
        formData.append("caption", uploadCaption);
      }

      await uploadPropertyImage(propertyId, formData);
      showToast({
        type: "success",
        title: "Image Uploaded",
        message: "Image successfully uploaded to Supabase Storage.",
      });
      setUploadFile(null);
      setUploadCaption("");
      setShowUploadModal(false);
      await loadProperty();
    } catch (err: any) {
      setUploadError(err?.message || "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimaryPropertyImage(propertyId, imageId);
      showToast({
        type: "success",
        title: "Cover Image Updated",
        message: "Selected image is now set as the primary cover photo.",
      });
      await loadProperty();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: err?.message || "Failed to set primary image.",
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this property photo?")) return;
    try {
      await deletePropertyImage(propertyId, imageId);
      showToast({
        type: "success",
        title: "Image Deleted",
        message: "Photo deleted from media gallery.",
      });
      await loadProperty();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: err?.message || "Failed to delete image.",
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Property not found or access restricted.</p>
        <Link href="/properties" className="mt-4 inline-block">
          <Button variant="gold" size="sm">Back to Listings</Button>
        </Link>
      </div>
    );
  }

  const images = property.images || [];
  const activeImage = images[activeImageIndex] || (property.primary_image_url ? { image_url: property.primary_image_url, id: "primary" } : null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/properties">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            All Listings
          </Button>
        </Link>

        {/* Action Controls (ADMIN/AGENT Only) */}
        {isEditor && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setShowUploadModal(true)}
            >
              Add Photo
            </Button>
            <Link href={`/properties/${property.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4 text-amber-400" />}
              >
                Edit Listing
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Property Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={property.status} />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              {property.listing_type_display}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {property.property_type_display}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {property.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{property.address}, {property.locality ? `${property.locality}, ` : ""}{property.city}</span>
          </p>
        </div>

        <div className="md:text-right">
          <span className="text-xs uppercase font-semibold text-slate-400 block">Asking Price</span>
          <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            {formatPrice(property.price)}
          </span>
          <span className="block text-xs text-slate-400 mt-0.5">
            {property.size} {property.size_unit_display}
          </span>
        </div>
      </div>

      {/* Media Gallery */}
      <Card variant="glass" className="overflow-hidden">
        <div className="relative h-[320px] md:h-[440px] w-full bg-slate-950 flex items-center justify-center">
          {activeImage ? (
            <img
              src={activeImage.image_url}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
              <Building2 className="w-16 h-16 opacity-40" />
              <p className="text-sm font-medium">No media photos available</p>
              {isEditor && (
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2"
                >
                  Upload First Photo
                </Button>
              )}
            </div>
          )}

          {activeImage && activeImage.caption && (
            <div className="absolute bottom-4 left-4 right-4 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs text-slate-200">
              {activeImage.caption}
            </div>
          )}
        </div>

        {/* Thumbnails Strip */}
        {images.length > 0 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center gap-3 overflow-x-auto">
            {images.map((img, idx) => {
              const isSelected = idx === activeImageIndex;
              return (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden flex-shrink-0 w-24 h-16 border-2 transition-all cursor-pointer ${
                    isSelected ? "border-amber-400 scale-105 shadow-md shadow-amber-950/30" : "border-slate-800 opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {img.is_primary && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 p-0.5 rounded-full" title="Primary Cover">
                      <Star className="w-3 h-3 fill-slate-950" />
                    </span>
                  )}

                  {/* Hover Actions (ADMIN/AGENT) */}
                  {isEditor && (
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(img.id);
                          }}
                          className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400"
                          title="Set as Primary Cover"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id);
                        }}
                        className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Description & Specs */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>About This Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {property.description || "No specific marketing description provided for this listing."}
              </p>
            </CardContent>
          </Card>

          {/* Location & Coordinates */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <Compass className="w-4 h-4 text-sky-400" />
                Location & Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">City</span>
                <span className="text-slate-200 font-medium">{property.city}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Locality / Sector</span>
                <span className="text-slate-200 font-medium">{property.locality || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Postal Code</span>
                <span className="text-slate-200 font-medium">{property.postal_code || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Latitude</span>
                <span className="text-slate-200 font-mono">{property.latitude || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Longitude</span>
                <span className="text-slate-200 font-mono">{property.longitude || "N/A"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Amenities & Facilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{amenity.name}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Owner / Landlord Record */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <User className="w-4 h-4 text-purple-400" />
                Owner / Landlord Details
              </CardTitle>
              <CardDescription>
                Internal confidential contact record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-300 flex items-center justify-center font-bold text-sm">
                  {property.owner_name?.charAt(0) || "O"}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    {property.owner_name || "Owner Name Unspecified"}
                  </span>
                  <span className="block text-[11px] text-slate-500 uppercase tracking-wider">
                    Property Owner
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="font-mono">{property.owner_contact || "No phone recorded"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{property.owner_email || "No email recorded"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Property Listing?"
        description="This action cannot be undone. All attached photos and records will be permanently removed."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteProperty}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to delete <strong className="text-white">"{property.title}"</strong>?
        </p>
      </Modal>

      {/* Upload Photo Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Property Image"
        description="Upload photos directly to Supabase Storage (JPEG, PNG, WEBP, max 10MB)."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={isUploading}
              onClick={handleUploadImage}
            >
              Upload to Supabase
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadImage} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Photo File *
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFileChange}
              className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Photo Caption / Tag (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Front Elevation, Master Bedroom, Kitchen"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full bg-slate-900/80 text-slate-100 text-sm rounded-xl border border-slate-800 px-3.5 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {uploadError && (
            <p className="text-xs font-medium text-rose-400">{uploadError}</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
