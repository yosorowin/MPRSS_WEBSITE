import { useEffect, useState } from "react";
import AdminLayout, { createAdminNotification } from "./AdminLayout";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db } from "../firebase";

const storage = getStorage();

const CATEGORY_OPTIONS = [
  "Engine Parts",
  "CVT / Transmission",
  "Braking System",
  "Suspension",
  "Electrical",
  "Tires & Wheels",
  "Maintenance / Fluids",
  "Body / Accessories",
  "Performance / Upgrade",
  "Consumables",
  "Other",
];

const DEFAULT_BRAND_OPTIONS = [
  "Honda",
  "Yamaha",
  "Suzuki",
  "Kawasaki",
  "KTM",
  "Kymco",
  "TVS",
  "SYM",
  "Euro Motor",
  "Keeway",
  "CFMOTO",
  "Benelli",
  "Royal Enfield",
  "Vespa",
  "BMW",
  "Ducati",
  "Triumph",
  "Harley-Davidson",
  "Other",
];

const DEFAULT_MODEL_OPTIONS = {
  Honda: ["Click 125i","Click 160","ADV 160","PCX 160","Beat","Beat Premium","Airblade 160","XRM 125","TMX 125 Alpha","CB150R","CBR150R","Other"],
  Yamaha: ["Mio i125","Mio Gear","Mio Gravis","NMAX","Aerox","Fazzio","Sniper 155","MT-15","YZF-R15","Other"],
  Suzuki: ["Raider R150","Burgman Street","Avenis 125","Skydrive Sport","Smash","Gixxer","GSX-R150","Other"],
  Kawasaki: ["Barako II","Rouser NS160","Rouser NS200","Ninja 400","Ninja 650","Z400","Z650","Other"],
  KTM: ["Duke 200","Duke 390","RC 200","RC 390","390 Adventure","Other"],
  Kymco: ["Like 125","KRV 180i","AK 550","X-Town 300i","Other"],
  TVS: ["NTORQ 125","Apache RTR 160","Apache RTR 200","XL100","King Deluxe","Other"],
  SYM: ["Jet 4 RX","Tuscany 150","Naga 155","Cruisym GT 150","Husky 150","Cruisym 400","ADX TG 400","Maxsym TL 508","VF3i 185 V3","Other"],
  "Euro Motor": ["EZ 125 EFI","Samurai 155i","Griffin 180i","Falcon 180i","Peak 110","Sport E 110 V2","Rock R 125 V3","Marvel 125","Vperman 150i","Other"],
  Keeway: ["Icon 110","Icon 125i","Other"],
  CFMOTO: ["300SR","300NK","450SR","450NK","650MT","650NK","Other"],
  Benelli: ["RFS 150i","Leoncino 250","302S","TNT 600i","Other"],
  "Royal Enfield": ["Classic 350","Meteor 350","Hunter 350","Interceptor 650","Continental GT 650","Other"],
  Vespa: ["S 125","Primavera 150","Sprint 150","GTS 300","Other"],
  BMW: ["G 310 R","G 310 GS","C 400 GT","F 900 R","Other"],
  Ducati: ["Monster","Panigale V2","Panigale V4","Scrambler","Other"],
  Triumph: ["Speed 400","Scrambler 400 X","Street Triple","Bonneville T100","Other"],
  "Harley-Davidson": ["Iron 883","Sportster S","Nightster","Street Bob","Other"],
  Other: ["Other"],
};

function AdminInventory() {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState("");
  const [catalogBrands, setCatalogBrands] = useState(DEFAULT_BRAND_OPTIONS);
  const [catalogModels, setCatalogModels] = useState(DEFAULT_MODEL_OPTIONS);
  const [expandedBrands, setExpandedBrands] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const emptyForm = {
    name: "",
    category: "",
    quantity: "",
    minStock: "",
    price: "",
    compatibleAllMotorcycles: false,
    compatibleBrands: [],
    compatibleModels: {},
    safetyNotes: "",
    visibleToCustomers: true,
    photoUrl: "",
    photoPath: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        setInventory(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setLoading(false);
        setFirestoreError("");
      },
      (error) => {
        console.error("INVENTORY FIRESTORE ERROR:", error);
        setInventory([]);
        setLoading(false);
        setFirestoreError(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "motorcycleCatalog"),
      (snapshot) => {
        if (snapshot.empty) {
          setCatalogBrands(DEFAULT_BRAND_OPTIONS);
          setCatalogModels(DEFAULT_MODEL_OPTIONS);
          return;
        }

        const brands = [];
        const models = {};

        snapshot.docs.forEach((item) => {
          const data = item.data();
          if (!data?.brand || data.status === "inactive") return;
          brands.push(data.brand);
          models[data.brand] = Array.isArray(data.models)
            ? data.models
            : ["Other"];
        });

        brands.sort((a, b) => {
          const ai = DEFAULT_BRAND_OPTIONS.indexOf(a);
          const bi = DEFAULT_BRAND_OPTIONS.indexOf(b);
          if (ai === -1 && bi === -1) return a.localeCompare(b);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });

        setCatalogBrands(brands.length ? brands : DEFAULT_BRAND_OPTIONS);
        setCatalogModels(
          Object.keys(models).length ? models : DEFAULT_MODEL_OPTIONS
        );
      },
      (error) => {
        console.error("MOTORCYCLE CATALOG ERROR:", error);
        setCatalogBrands(DEFAULT_BRAND_OPTIONS);
        setCatalogModels(DEFAULT_MODEL_OPTIONS);
      }
    );

    return () => unsubscribe();
  }, []);

  const lowStockItems = inventory.filter(
    (item) =>
      Number(item.quantity || 0) <= Number(item.minStock || 0)
  );

  const totalValue = inventory.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const categories = [
    "All",
    ...Array.from(
      new Set(inventory.map((item) => item.category).filter(Boolean))
    ),
  ];

  const filteredInventory = inventory.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      String(item.name || "").toLowerCase().includes(search) ||
      String(item.category || "").toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category === category ? "" : category,
    }));
  };

  const handleBrandToggle = (brand) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.compatibleBrands)
        ? prev.compatibleBrands
        : [];
      const selected = current.includes(brand);

      if (selected) {
        const models = { ...prev.compatibleModels };
        delete models[brand];

        return {
          ...prev,
          compatibleBrands: current.filter((x) => x !== brand),
          compatibleModels: models,
        };
      }

      return {
        ...prev,
        compatibleBrands: [...current, brand],
      };
    });

    setExpandedBrands((prev) => ({ ...prev, [brand]: true }));
  };

  const handleModelToggle = (brand, model) => {
    setFormData((prev) => {
      const current = prev.compatibleModels?.[brand] || [];
      const selected = current.includes(model);

      return {
        ...prev,
        compatibleModels: {
          ...prev.compatibleModels,
          [brand]: selected
            ? current.filter((x) => x !== model)
            : [...current, model],
        },
      };
    });
  };

  const handleAllMotorcyclesToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      compatibleAllMotorcycles: checked,
      compatibleBrands: checked ? [] : prev.compatibleBrands,
      compatibleModels: checked ? {} : prev.compatibleModels,
    }));

    if (checked) setExpandedBrands({});
  };

  const toggleBrandExpansion = (brand) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brand]: !prev[brand],
    }));
  };

  const convertOldCompatibilityData = (part) => {
    if (part.compatibleAllMotorcycles === true) {
      return {
        compatibleAllMotorcycles: true,
        compatibleBrands: [],
        compatibleModels: {},
      };
    }

    if (
      part.compatibleModels &&
      typeof part.compatibleModels === "object" &&
      !Array.isArray(part.compatibleModels)
    ) {
      return {
        compatibleAllMotorcycles: false,
        compatibleBrands: Array.isArray(part.compatibleBrands)
          ? part.compatibleBrands
          : Object.keys(part.compatibleModels),
        compatibleModels: part.compatibleModels,
      };
    }

    const compatibleBrands = Array.isArray(part.compatibleBrands)
      ? part.compatibleBrands
      : [];

    const compatibleModels = {};

    if (Array.isArray(part.compatibleModels)) {
      if (
        part.compatibleModels.includes("All Models") ||
        part.compatibleModels.includes("All Motorcycles")
      ) {
        return {
          compatibleAllMotorcycles: true,
          compatibleBrands: [],
          compatibleModels: {},
        };
      }

      part.compatibleModels.forEach((modelName) => {
        for (const brand of Object.keys(catalogModels)) {
          if ((catalogModels[brand] || []).includes(modelName)) {
            if (!compatibleModels[brand]) compatibleModels[brand] = [];
            compatibleModels[brand].push(modelName);
            break;
          }
        }
      });
    }

    return {
      compatibleAllMotorcycles: false,
      compatibleBrands,
      compatibleModels,
    };
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removeSelectedPhoto = () => {
    if (photoPreview && selectedPhoto) {
      URL.revokeObjectURL(photoPreview);
    }

    setSelectedPhoto(null);
    setPhotoPreview("");
  };

  const uploadProductPhoto = async (inventoryId) => {
    if (!selectedPhoto) {
      return {
        photoUrl: formData.photoUrl || "",
        photoPath: formData.photoPath || "",
      };
    }

    const extension =
      selectedPhoto.name.split(".").pop()?.toLowerCase() || "jpg";

    const photoPath = `inventory/${inventoryId}/product-${Date.now()}.${extension}`;
    const storageRef = ref(storage, photoPath);

    setUploadingPhoto(true);

    try {
      await uploadBytes(storageRef, selectedPhoto);
      const photoUrl = await getDownloadURL(storageRef);

      if (formData.photoPath && formData.photoPath !== photoPath) {
        try {
          await deleteObject(ref(storage, formData.photoPath));
        } catch (error) {
          console.warn("Old product photo could not be deleted:", error);
        }
      }

      return { photoUrl, photoPath };
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePart = async () => {
    try {
      if (!formData.name.trim()) {
        alert("Please enter a part name.");
        return;
      }

      if (!formData.category) {
        alert("Please select a category.");
        return;
      }

      if (
        formData.quantity === "" ||
        formData.minStock === "" ||
        formData.price === ""
      ) {
        alert("Please complete all required fields.");
        return;
      }

      if (
        formData.visibleToCustomers &&
        !formData.photoUrl &&
        !selectedPhoto
      ) {
        alert(
          "Please upload a product photo before making this part visible to customers."
        );
        return;
      }

      if (
        !formData.compatibleAllMotorcycles &&
        formData.compatibleBrands.length === 0
      ) {
        alert(
          "Please select at least one compatible brand/model, or choose All Motorcycles."
        );
        return;
      }

      const partData = {
        name: formData.name.trim(),
        category: formData.category,
        quantity: Number(formData.quantity) || 0,
        minStock: Number(formData.minStock) || 0,
        price: Number(formData.price) || 0,
        compatibleAllMotorcycles: Boolean(
          formData.compatibleAllMotorcycles
        ),
        compatibleBrands: formData.compatibleAllMotorcycles
          ? []
          : formData.compatibleBrands,
        compatibleModels: formData.compatibleAllMotorcycles
          ? {}
          : formData.compatibleModels || {},
        safetyNotes: formData.safetyNotes.trim(),
        visibleToCustomers: formData.visibleToCustomers,
        updatedAt: serverTimestamp(),
      };

      let inventoryId = editingId;

      if (!inventoryId) {
        inventoryId = doc(collection(db, "inventory")).id;
      }

      if (formData.visibleToCustomers) {
        const photoData = await uploadProductPhoto(inventoryId);
        partData.photoUrl = photoData.photoUrl;
        partData.photoPath = photoData.photoPath;
      } else {
        partData.photoUrl = formData.photoUrl || "";
        partData.photoPath = formData.photoPath || "";
      }

      const partRef = doc(db, "inventory", inventoryId);

      const previousPart = inventory.find((item) => item.id === inventoryId);
      const previousQuantity = previousPart
        ? Number(previousPart.quantity || 0)
        : null;
      const previousMinStock = previousPart
        ? Number(previousPart.minStock || 0)
        : null;
      const wasLowStock = previousPart
        ? previousQuantity <= previousMinStock
        : false;
      const isLowStock = Number(partData.quantity || 0) <= Number(partData.minStock || 0);
      const stockThresholdChanged = previousPart
        ? previousQuantity !== Number(partData.quantity || 0) ||
          previousMinStock !== Number(partData.minStock || 0)
        : true;

      if (isEditing) {
        await updateDoc(partRef, partData);
      } else {
        await setDoc(partRef, {
          ...partData,
          createdAt: serverTimestamp(),
        });
      }

      // Notify when a new part is low, stock crosses into low stock,
      // or the quantity/minimum changes while the part remains low.
      // Editing unrelated product details will not create duplicate alerts.
      if (isLowStock && (!wasLowStock || stockThresholdChanged)) {
        await createAdminNotification({
          title: "Low Inventory Stock",
          message: `${partData.name} has ${partData.quantity} in stock (minimum: ${partData.minStock}).`,
          type: "inventory",
          route: "/admin/inventory",
          relatedId: inventoryId,
        });
      }

      closeModal();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      alert(
        error?.message ||
          "Failed to save inventory item. Please try again."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePart = async (part) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${part.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "inventory", part.id));

      if (part.photoPath) {
        try {
          await deleteObject(ref(storage, part.photoPath));
        } catch (error) {
          console.warn("Product photo could not be deleted:", error);
        }
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      alert("Failed to delete inventory item. Please try again.");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setExpandedBrands({});
    setSelectedPhoto(null);
    setPhotoPreview("");
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (part) => {
    const compatibility = convertOldCompatibilityData(part);

    setIsEditing(true);
    setEditingId(part.id);
    setSelectedPhoto(null);
    setPhotoPreview(part.photoUrl || "");

    setFormData({
      name: part.name || "",
      category: part.category || "",
      quantity: String(part.quantity ?? ""),
      minStock: String(part.minStock ?? ""),
      price: String(part.price ?? ""),
      compatibleAllMotorcycles:
        compatibility.compatibleAllMotorcycles,
      compatibleBrands: compatibility.compatibleBrands,
      compatibleModels: compatibility.compatibleModels,
      safetyNotes: part.safetyNotes || "",
      visibleToCustomers: part.visibleToCustomers !== false,
      photoUrl: part.photoUrl || "",
      photoPath: part.photoPath || "",
    });

    const expanded = {};
    compatibility.compatibleBrands.forEach((brand) => {
      expanded[brand] = true;
    });
    setExpandedBrands(expanded);
    setShowModal(true);
  };

  const closeModal = () => {
    if (photoPreview && selectedPhoto) {
      URL.revokeObjectURL(photoPreview);
    }

    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setExpandedBrands({});
    setSelectedPhoto(null);
    setPhotoPreview("");
    setFormData({ ...emptyForm });
  };

  return (
    <AdminLayout title="Inventory">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[#0a0f1a] text-white rounded-xl p-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-3 font-semibold">
              Total Inventory Value
            </p>
            <p className="text-4xl font-bold leading-none mb-1">
              ₱{totalValue.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {inventory.length} parts in inventory
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Package size={20} className="text-white" />
          </div>
        </div>

        <div
          className={`rounded-xl border p-6 ${
            lowStockItems.length > 0
              ? "bg-white border-amber-200"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                lowStockItems.length > 0 ? "bg-amber-50" : "bg-gray-100"
              }`}
            >
              <AlertCircle
                size={16}
                className={
                  lowStockItems.length > 0
                    ? "text-amber-600"
                    : "text-gray-400"
                }
              />
            </div>

            {lowStockItems.length > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Reorder Needed
              </span>
            )}
          </div>

          <p
            className={`text-4xl font-bold leading-none ${
              lowStockItems.length > 0 ? "text-amber-600" : "text-gray-900"
            }`}
          >
            {lowStockItems.length}
          </p>

          <p className="text-xs text-gray-400 mt-1.5">Low stock items</p>
        </div>
      </div>

      {firestoreError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <strong>Firestore Error:</strong> {firestoreError}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5 text-sm text-gray-500">
          Loading inventory...
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2.5">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              Items Requiring Reorder
            </h3>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {lowStockItems.length} items
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {lowStockItems.map((item) => {
              const quantity = Number(item.quantity || 0);
              const minStock = Number(item.minStock || 0);
              const deficit = Math.max(minStock - quantity, 0);
              const fillPct =
                minStock > 0
                  ? Math.min((quantity / minStock) * 100, 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="px-5 py-3.5 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>

                      <span className="text-xs text-amber-600 font-medium shrink-0">
                        {quantity}/{minStock}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">
                      {deficit > 0
                        ? `Need ${deficit} more`
                        : "At minimum stock"}
                    </p>
                  </div>

                  <button
                    onClick={() => openEditModal(item)}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-52">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            />
          </div>

          <div className="relative min-w-40">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Part
        </button>
      </div>

      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Part Name
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Visible
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filteredInventory.map((part) => {
              const quantity = Number(part.quantity || 0);
              const minStock = Number(part.minStock || 0);
              const isLow = quantity <= minStock;

              return (
                <tr
                  key={part.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {part.photoUrl && (
                        <img
                          src={part.photoUrl}
                          alt={part.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {part.name}
                        </p>
                        {part.safetyNotes && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            ⚠ {part.safetyNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {part.category}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isLow ? "text-amber-600" : "text-gray-800"
                        }`}
                      >
                        {quantity}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {minStock} min
                      </span>
                      {isLow && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                          LOW
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-gray-800 font-medium">
                    ₱{Number(part.price || 0).toLocaleString()}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        part.visibleToCustomers
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {part.visibleToCustomers ? "Visible" : "Hidden"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(part)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePart(part)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3">
        {filteredInventory.map((part) => {
          const quantity = Number(part.quantity || 0);
          const minStock = Number(part.minStock || 0);
          const isLow = quantity <= minStock;

          return (
            <div
              key={part.id}
              className={`bg-white rounded-xl border shadow-sm p-4 ${
                isLow ? "border-amber-100" : "border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {part.photoUrl && (
                    <img
                      src={part.photoUrl}
                      alt={part.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {part.name}
                      </h3>
                      {isLow && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          LOW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{part.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openEditModal(part)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDeletePart(part)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">Stock</p>
                  <p
                    className={`font-medium ${
                      isLow ? "text-amber-600" : "text-gray-800"
                    }`}
                  >
                    {quantity} / {minStock}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 mb-0.5">Price</p>
                  <p className="font-medium text-gray-800">
                    ₱{Number(part.price || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 mb-0.5">Visible</p>
                  <p className="font-medium text-gray-700">
                    {part.visibleToCustomers ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {part.safetyNotes && (
                <p className="text-xs text-gray-500 mt-2.5 pt-2.5 border-t border-gray-100">
                  ⚠ {part.safetyNotes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-4 shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              {isEditing ? "Edit Part" : "Add New Part"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Part Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <label
                      key={category}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.category === category
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.category === category}
                        onChange={() => handleCategoryChange(category)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>

                <p className="text-[11px] text-gray-400 mt-1.5">
                  Select one category for this part.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Stock equal to this number is considered LOW.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Price (₱) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                />
              </div>

              {/* Product Photo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Product Photo{" "}
                  {formData.visibleToCustomers ? "*" : "(Optional)"}
                </label>

                {formData.visibleToCustomers ? (
                  <div className="border border-gray-200 rounded-lg p-3">
                    {photoPreview ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={photoPreview}
                          alt="Product preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />

                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            {selectedPhoto
                              ? selectedPhoto.name
                              : "Current product photo"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG, WEBP up to 5 MB
                          </p>

                          <div className="flex gap-2 mt-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium">
                              <Upload size={13} />
                              Change Photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                              />
                            </label>

                            {selectedPhoto && (
                              <button
                                type="button"
                                onClick={removeSelectedPhoto}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium"
                              >
                                <X size={13} />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload size={22} className="text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">
                          Upload Product Photo
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          JPG, PNG, WEBP up to 5 MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-2.5">
                    Enable <strong>Visible to Customers</strong> to add a
                    product photo for the Parts Catalog.
                  </p>
                )}
              </div>

              {/* Compatible Motorcycles */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Compatible Motorcycles
                </label>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.compatibleAllMotorcycles}
                      onChange={(e) =>
                        handleAllMotorcyclesToggle(e.target.checked)
                      }
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Compatible with All Motorcycles
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Use this when the part fits every motorcycle.
                      </p>
                    </div>
                  </label>

                  {!formData.compatibleAllMotorcycles && (
                    <div className="max-h-72 overflow-y-auto">
                      {catalogBrands.map((brand) => {
                        const brandSelected =
                          formData.compatibleBrands.includes(brand);

                        const models =
                          catalogModels[brand] ||
                          DEFAULT_MODEL_OPTIONS[brand] ||
                          ["Other"];

                        const selectedModels =
                          formData.compatibleModels?.[brand] || [];

                        return (
                          <div
                            key={brand}
                            className="border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <label className="flex items-center gap-2 flex-1 p-3 cursor-pointer hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={brandSelected}
                                  onChange={() => handleBrandToggle(brand)}
                                  className="w-4 h-4 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {brand}
                                </span>

                                {brandSelected && (
                                  <span className="text-[10px] text-gray-400">
                                    {selectedModels.length} model
                                    {selectedModels.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </label>

                              {brandSelected && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleBrandExpansion(brand)
                                  }
                                  className="p-2 mr-1 text-gray-400 hover:text-gray-700"
                                >
                                  {expandedBrands[brand] ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </button>
                              )}
                            </div>

                            {brandSelected &&
                              expandedBrands[brand] && (
                                <div className="bg-gray-50 px-5 pb-3">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 pt-2 mb-2">
                                    Select Models
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    {models.map((model) => (
                                      <label
                                        key={model}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-white cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedModels.includes(
                                            model
                                          )}
                                          onChange={() =>
                                            handleModelToggle(brand, model)
                                          }
                                          className="w-4 h-4 rounded"
                                        />
                                        <span className="text-xs text-gray-600">
                                          {model}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!formData.compatibleAllMotorcycles &&
                  formData.compatibleBrands.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1.5">
                      Select at least one compatible brand/model, or choose
                      All Motorcycles.
                    </p>
                  )}
              </div>

              {/* Safety Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Safety Notes
                </label>
                <textarea
                  value={formData.safetyNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyNotes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  rows={2}
                  placeholder="Optional safety or installation notes..."
                />
              </div>

              {/* Visibility */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visibleToCustomers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibleToCustomers: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />

                  <span className="text-sm text-gray-700">
                    Visible to Customers
                  </span>
                </label>

                <p className="text-[11px] text-gray-400 mt-1.5 ml-6">
                  When enabled, customers can see this part in the Parts
                  Catalog and a product photo is required.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePart}
                disabled={uploadingPhoto}
                className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto
                  ? "Uploading Photo..."
                  : isEditing
                  ? "Save Changes"
                  : "Save Part"}
              </button>

              <button
                onClick={closeModal}
                disabled={uploadingPhoto}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminInventory;