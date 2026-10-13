import { useEffect, useMemo, useState } from "react";
import AdminLayout, { createAdminNotification } from "./AdminLayout";
import {
  Clock,
  CheckCircle,
  X,
  Check,
  Printer,
  Play,
} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Service lifecycle updates are customer-facing only.
// Admin notifications are created when a customer submits a NEW service request
// in the customer app (serviceRequestStore.js), not when an admin changes status.
const notifyServiceLifecycle = async (service, title, message, status) => {
  const customerId =
    service?.customerId ||
    service?.userId ||
    service?.customerUid ||
    service?.user?.uid ||
    service?.user?.id ||
    service?.customer?.uid ||
    service?.customer?.id;

  if (!customerId) {
    console.warn(
      "Customer notification skipped because the service has no customer UID.",
      service?.id
    );
    return;
  }

  await addDoc(collection(db, "notifications"), {
    customerId,
    recipientRole: "customer",
    type: "service",
    title,
    message,
    route: "/services",
    serviceId: service?.id || "",
    status: status || "",
    read: false,
    createdAt: serverTimestamp(),
  });
};

// ============================================================
// OPTIONS
// ============================================================

const estimatedCostOptions = [
  100,
  200,
  300,
  400,
  500,
  750,
  1000,
  1500,
  2000,
  2500,
  3000,
];

const estimatedTimeOptions = [
  "30 minutes",
  "1 hour",
  "1 hour 30 minutes",
  "2 hours",
  "2 hours 30 minutes",
  "3 hours",
  "4 hours",
  "5 hours",
  "6 hours",
  "1 day",
];

// ============================================================
// HELPERS
// ============================================================

const normalizeStatus = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

const formatDate = (value) => {
  if (!value) return "—";

  try {
    if (value?.toDate) {
      return value.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatMotorcycle = (motorcycle) => {
  if (!motorcycle) return "—";

  if (typeof motorcycle === "string") return motorcycle;

  const brand = motorcycle.brand || "";
  const model = motorcycle.model || "";
  const year = motorcycle.year ? ` ${motorcycle.year}` : "";

  const result = `${brand} ${model}${year}`.trim();

  return result || motorcycle.name || motorcycle.motorcycleName || "—";
};

const getCustomer = (service, users) => {
  if (service.customerName) return service.customerName;

  const customerId =
    service.customerId ||
    service.userId ||
    service.user?.id ||
    service.customer?.id;

  const customer = users.find(
    (user) => user.id === customerId || user.uid === customerId
  );

  if (!customer) {
    return (
      service.customer?.name ||
      service.user?.name ||
      service.customerEmail ||
      "Unknown Customer"
    );
  }

  return (
    customer.fullName ||
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.email ||
    "Unknown Customer"
  );
};

const getMotorcycle = (service, motorcycles) => {
  if (service.motorcycle) {
    if (typeof service.motorcycle === "object") {
      return formatMotorcycle(service.motorcycle);
    }

    return service.motorcycle;
  }

  const motorcycleId =
    service.motorcycleId ||
    service.motorcycleID ||
    service.vehicleId;

  const motorcycle = motorcycles.find(
    (item) =>
      item.id === motorcycleId || item.motorcycleId === motorcycleId
  );

  return motorcycle ? formatMotorcycle(motorcycle) : "—";
};

const enrichService = (service, users, motorcycles) => ({
  ...service,

  customerName: getCustomer(service, users),

  motorcycleDisplay: getMotorcycle(service, motorcycles),

  requestDate:
    service.requestDate ||
    service.createdAt ||
    service.dateRequested,

  preferredDate:
    service.preferredDate ||
    service.scheduleDate ||
    service.serviceDate,

  preferredTime:
    service.preferredTime ||
    service.scheduleTime ||
    service.serviceTime,

  displayStatus:
    service.status ||
    service.approvalStatus ||
    "Pending",

  displayCost:
    service.estimatedCost ??
    service.cost ??
    service.totalCost ??
    0,
});

const getDisplayStatus = (service) => {
  const status = normalizeStatus(service.status);

  if (status === "rejected") return "Rejected";
  if (status === "completed") return "Completed";
  if (status === "quality check") return "Quality Check";
  if (status === "waiting for parts") return "Waiting for Parts";
  if (status === "in progress") return "In Progress";

  if (
    normalizeStatus(service.approvalStatus) === "approved" &&
    status === "pending"
  ) {
    return "Approved";
  }

  return "Pending";
};

// ============================================================
// INVENTORY HELPERS
// ============================================================

const getInventoryPartName = (part) => {
  return (
    part.partName ||
    part.name ||
    part.itemName ||
    part.productName ||
    part.part ||
    part.description ||
    "Unnamed Part"
  );
};

const getInventoryPartNumber = (part) => {
  return (
    part.partNumber ||
    part.itemCode ||
    part.sku ||
    part.code ||
    ""
  );
};

const getInventoryStock = (part) => {
  const possibleValues = [
    part.stock,
    part.quantity,
    part.currentStock,
    part.stockQuantity,
    part.stocks,
  ];

  for (const value of possibleValues) {
    const number = Number(value);

    if (!Number.isNaN(number)) {
      return number;
    }
  }

  return 0;
};

const getInventoryStockField = (part) => {
  if (Object.prototype.hasOwnProperty.call(part, "stock")) {
    return "stock";
  }

  if (Object.prototype.hasOwnProperty.call(part, "quantity")) {
    return "quantity";
  }

  if (Object.prototype.hasOwnProperty.call(part, "currentStock")) {
    return "currentStock";
  }

  if (Object.prototype.hasOwnProperty.call(part, "stockQuantity")) {
    return "stockQuantity";
  }

  if (Object.prototype.hasOwnProperty.call(part, "stocks")) {
    return "stocks";
  }

  return "stock";
};

// ============================================================
// COMPONENT
// ============================================================

const AdminServices = () => {
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [activeTab, setActiveTab] = useState("requests");

  // Approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [completionCost, setCompletionCost] = useState("");

  // Selected inventory parts
  const [selectedParts, setSelectedParts] = useState({});

  const [savingStatus, setSavingStatus] = useState(false);

  const [loading, setLoading] = useState(true);

  // ============================================================
  // FIREBASE LISTENERS
  // ============================================================

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    );

    const unsubStaff = onSnapshot(
      collection(db, "staff"),
      (snapshot) => {
        setStaff(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => {
        console.error("Error loading staff:", error);
        setStaff([]);
      }
    );

    const unsubMotorcycles = onSnapshot(
      collection(db, "motorcycles"),
      (snapshot) => {
        setMotorcycles(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => {
        console.error("Error loading motorcycles:", error);
        setMotorcycles([]);
      }
    );

    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        setServices(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        setLoading(false);
      },
      (error) => {
        console.error("Error loading services:", error);
        setLoading(false);
      }
    );

    const unsubInventory = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        setInventory(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => {
        console.error("Error loading inventory:", error);
        setInventory([]);
      }
    );

    return () => {
      unsubUsers();
      unsubStaff();
      unsubMotorcycles();
      unsubServices();
      unsubInventory();
    };
  }, []);

  // ============================================================
  // ENRICHED SERVICES
  // ============================================================

  const enrichedServices = useMemo(() => {
    return services.map((service) =>
      enrichService(service, users, motorcycles)
    );
  }, [services, users, motorcycles]);

  // ============================================================
  // SERVICE LISTS
  // ============================================================

  const serviceRequests = useMemo(() => {
    const getRequestTimestamp = (service) => {
      const dateFields = [
        service.createdAt,
        service.requestedAt,
        service.requestDate,
        service.submittedAt,
        service.dateCreated,
      ];

      for (const value of dateFields) {
        if (!value) continue;

        // Firestore Timestamp
        if (typeof value.toMillis === "function") {
          return value.toMillis();
        }

        // Serialized Firestore Timestamp
        if (typeof value.seconds === "number") {
          return value.seconds * 1000;
        }

        // JavaScript Date or date string
        const timestamp =
          value instanceof Date
            ? value.getTime()
            : typeof value === "string" || typeof value === "number"
            ? new Date(value).getTime()
            : NaN;

        if (Number.isFinite(timestamp)) {
          return timestamp;
        }
      }

      return 0;
    };

    return enrichedServices
      .filter((service) => {
        const status = normalizeStatus(service.status);
        const approvalStatus = normalizeStatus(service.approvalStatus);

        if (status === "rejected") return false;

        return (
          status === "pending" ||
          status === "pending approval" ||
          approvalStatus === "pending"
        );
      })
      .sort((a, b) => getRequestTimestamp(b) - getRequestTimestamp(a));
  }, [enrichedServices]);

  const activeServices = useMemo(() => {
    return enrichedServices.filter((service) => {
      const status = normalizeStatus(service.status);

      return [
        "in progress",
        "active",
        "waiting for parts",
        "quality check",
      ].includes(status);
    });
  }, [enrichedServices]);

  const completedServices = useMemo(() => {
    return enrichedServices.filter(
      (service) => normalizeStatus(service.status) === "completed"
    );
  }, [enrichedServices]);

  const mechanics = useMemo(() => {
    return staff.filter((person) => {
      const role = normalizeStatus(
        person.position ||
          person.role ||
          person.jobTitle ||
          ""
      );

      return (
        role.includes("mechanic") ||
        role.includes("technician") ||
        role === "staff"
      );
    });
  }, [staff]);

  // ============================================================
  // INVENTORY PART SELECTION
  // ============================================================

  const handlePartToggle = (part) => {
    setSelectedParts((previous) => {
      const updated = { ...previous };

      if (updated[part.id]) {
        delete updated[part.id];
      } else {
        updated[part.id] = {
          quantity: 1,
        };
      }

      return updated;
    });
  };

  const handlePartQuantityChange = (partId, value) => {
    const quantity = Math.max(1, Number(value) || 1);

    setSelectedParts((previous) => ({
      ...previous,
      [partId]: {
        ...previous[partId],
        quantity,
      },
    }));
  };

  const getSelectedPartsData = () => {
    return inventory
      .filter((part) => selectedParts[part.id])
      .map((part) => {
        const quantity = Math.max(
          1,
          Number(selectedParts[part.id]?.quantity) || 1
        );

        return {
          inventoryId: part.id,
          partName: getInventoryPartName(part),
          partNumber: getInventoryPartNumber(part),
          quantity,
          stockBefore: getInventoryStock(part),
          stockAfter:
            getInventoryStock(part) - quantity,
        };
      });
  };

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = (service) => {
    setSelectedService(service);

    setEstimatedCost(
      service.estimatedCost
        ? String(service.estimatedCost)
        : ""
    );

    setEstimatedTime(service.estimatedTime || "");

    setAssignedStaffId(service.assignedStaffId || "");

    setAssignedStaff(
      service.assignedStaff ||
        service.assignedStaffName ||
        ""
    );

    setShowApprovalModal(true);
  };

  const getServiceDayKey = (service) => {
    const value =
      service?.preferredDate ||
      service?.scheduleDate ||
      service?.serviceDate ||
      service?.appointmentDate ||
      service?.scheduledDate;

    if (!value) return "";

    let date;
    if (typeof value?.toDate === "function") {
      date = value.toDate();
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return value.trim();
    } else {
      date = value instanceof Date ? value : new Date(value);
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return String(value).trim();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSaveApproval = async () => {
    if (!selectedService) return;

    if (!estimatedCost) {
      alert("Please select an estimated cost.");
      return;
    }

    if (!estimatedTime) {
      alert("Please select an estimated time.");
      return;
    }

    if (!assignedStaffId) {
      alert("Please select a mechanic / staff member.");
      return;
    }

    try {
      const selectedStaff = mechanics.find(
        (person) => person.id === assignedStaffId
      );

      const selectedDay = getServiceDayKey(selectedService);
      if (!selectedDay) {
        alert("This service request has no valid preferred service date. Please check the request before approving it.");
        return;
      }

      const excludedStatuses = ["rejected", "cancelled", "canceled", "declined"];
      const mechanicBookingsForDay = services.filter((service) => {
        if (service.id === selectedService.id) return false;

        const status = normalizeStatus(service.status);
        const approvalStatus = normalizeStatus(service.approvalStatus);
        if (excludedStatuses.includes(status) || excludedStatuses.includes(approvalStatus)) {
          return false;
        }

        const serviceStaffId = service.assignedStaffId || service.mechanicId || "";
        const serviceStaffName = service.assignedStaff || service.assignedStaffName || service.mechanicName || "";
        const sameMechanic = serviceStaffId
          ? serviceStaffId === assignedStaffId
          : Boolean(selectedStaff && serviceStaffName && serviceStaffName === (selectedStaff.fullName || selectedStaff.name));

        return sameMechanic && getServiceDayKey(service) === selectedDay;
      });

      if (mechanicBookingsForDay.length >= 8) {
        const mechanicName = selectedStaff?.fullName || selectedStaff?.name || assignedStaff || "This mechanic";
        alert(`${mechanicName} already has 8 bookings on ${selectedDay}. Please choose another mechanic or date.`);
        return;
      }

      await updateDoc(
        doc(db, "services", selectedService.id),
        {
          approvalStatus: "approved",

          status: "Pending",

          paymentMethodApproved: false,

          paymentMethodApprovalStatus: "pending",

          paymentStatus: "Not Yet Paid",

          assignedStaff:
            selectedStaff?.fullName ||
            selectedStaff?.name ||
            assignedStaff ||
            "",

          assignedStaffId:
            selectedStaff?.id ||
            assignedStaffId ||
            null,

          assignedStaffPosition:
            selectedStaff?.position ||
            selectedStaff?.role ||
            selectedStaff?.jobTitle ||
            "",

          estimatedCost: Number(estimatedCost) || 0,

          estimatedTime: estimatedTime.trim(),

          approvedAt: serverTimestamp(),

          updatedAt: serverTimestamp(),
        }
      );

      await notifyServiceLifecycle(
        selectedService,
        "Service Request Accepted",
        "Your service request has been accepted. Current status: Pending.",
        "Pending"
      );

      setShowApprovalModal(false);
      setSelectedService(null);

      setEstimatedCost("");
      setEstimatedTime("");
      setAssignedStaff("");
      setAssignedStaffId("");
    } catch (error) {
      console.error("Error approving service:", error);
      alert("Failed to approve service.");
    }
  };

  // ============================================================
  // REJECT
  // ============================================================

  const handleReject = (service) => {
    setSelectedService(service);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleSaveRejection = async () => {
    if (!selectedService) return;

    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "services", selectedService.id),
        {
          approvalStatus: "rejected",
          status: "Rejected",
          rejectionReason: rejectionReason.trim(),
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await notifyServiceLifecycle(
        selectedService,
        "Service Request Rejected",
        `Your service request was rejected. Reason: ${rejectionReason.trim()}`,
        "Rejected"
      );

      setShowRejectModal(false);
      setSelectedService(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert("Failed to reject service.");
    }
  };

  // ============================================================
  // PAYMENT METHOD APPROVAL
  // ============================================================

  const handleApprovePaymentMethod = async (service) => {
    if (!service.paymentMethod) {
      alert("The customer has not selected a payment method yet.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "services", service.id),
        {
          paymentMethodApproved: true,
          paymentMethodApprovalStatus: "approved",
          paymentMethodApprovedAt: serverTimestamp(),
          paymentStatus: "Not Yet Paid",
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Error approving payment method:",
        error
      );

      alert("Failed to approve payment method.");
    }
  };

  // ============================================================
  // START SERVICE
  // ============================================================

  const handleActivate = async (service) => {
    if (service.paymentMethodApproved !== true) {
      alert("Please approve the customer's payment method first.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "services", service.id),
        {
          status: "In Progress",
          activatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await notifyServiceLifecycle(
        service,
        "Service Started",
        "Your motorcycle service is now in progress.",
        "In Progress"
      );
    } catch (error) {
      console.error(
        "Error starting service:",
        error
      );

      alert("Failed to start service.");
    }
  };

  // ============================================================
  // STATUS MODAL
  // ============================================================

  const handleOpenStatusModal = (service) => {
    setSelectedService(service);

    setNewStatus(service.status || "In Progress");

    setCompletionCost(
      service.cost
        ? String(service.cost)
        : service.estimatedCost
        ? String(service.estimatedCost)
        : ""
    );

    setSelectedParts({});

    setSavingStatus(false);

    setShowStatusModal(true);
  };

  // ============================================================
  // SAVE STATUS
  // ============================================================

  const handleSaveStatus = async () => {
    if (!selectedService) return;

    if (savingStatus) return;

    const isCompleted =
      normalizeStatus(newStatus) === "completed";

    setSavingStatus(true);

    try {
      // --------------------------------------------------------
      // NORMAL STATUS UPDATE
      // --------------------------------------------------------

      if (!isCompleted) {
        await updateDoc(
          doc(db, "services", selectedService.id),
          {
            status: newStatus,
            updatedAt: serverTimestamp(),
          }
        );

        await notifyServiceLifecycle(
          selectedService,
          "Service Status Updated",
          `Your service status has been updated to ${newStatus}.`,
          newStatus
        );

        setShowStatusModal(false);
        setSelectedService(null);
        setSelectedParts({});
        setSavingStatus(false);

        return;
      }

      // --------------------------------------------------------
      // COMPLETING SERVICE
      // --------------------------------------------------------

      const selectedPartsData = getSelectedPartsData();

      // Check stock before starting transaction.
      for (const selectedPart of selectedPartsData) {
        const inventoryPart = inventory.find(
          (part) => part.id === selectedPart.inventoryId
        );

        if (!inventoryPart) {
          throw new Error(
            `${selectedPart.partName} is no longer available in inventory.`
          );
        }

        const availableStock =
          getInventoryStock(inventoryPart);

        if (selectedPart.quantity > availableStock) {
          throw new Error(
            `Not enough stock for ${selectedPart.partName}. Available: ${availableStock}, requested: ${selectedPart.quantity}.`
          );
        }
      }

      // --------------------------------------------------------
      // FIREBASE TRANSACTION
      // --------------------------------------------------------

      await runTransaction(db, async (transaction) => {
        const serviceRef = doc(
          db,
          "services",
          selectedService.id
        );

        const serviceSnapshot =
          await transaction.get(serviceRef);

        if (!serviceSnapshot.exists()) {
          throw new Error(
            "The service no longer exists."
          );
        }

        const currentService =
          serviceSnapshot.data();

        if (
          currentService.inventoryDeducted === true
        ) {
          throw new Error(
            "Inventory has already been deducted for this service."
          );
        }

        const inventorySnapshots = [];

        for (const selectedPart of selectedPartsData) {
          const inventoryRef = doc(
            db,
            "inventory",
            selectedPart.inventoryId
          );

          const inventorySnapshot =
            await transaction.get(inventoryRef);

          if (!inventorySnapshot.exists()) {
            throw new Error(
              `${selectedPart.partName} is no longer available in inventory.`
            );
          }

          inventorySnapshots.push({
            selectedPart,
            inventoryRef,
            snapshot: inventorySnapshot,
          });
        }

        // ------------------------------------------------------
        // CHECK STOCK AGAIN INSIDE TRANSACTION
        // ------------------------------------------------------

        const finalPartsUsed = [];

        for (const item of inventorySnapshots) {
          const inventoryData =
            item.snapshot.data();

          const currentStock =
            getInventoryStock(inventoryData);

          if (
            item.selectedPart.quantity >
            currentStock
          ) {
            throw new Error(
              `Not enough stock for ${item.selectedPart.partName}. Available: ${currentStock}, requested: ${item.selectedPart.quantity}.`
            );
          }

          const stockField =
            getInventoryStockField(
              inventoryData
            );

          const newStock =
            currentStock -
            item.selectedPart.quantity;

          transaction.update(
            item.inventoryRef,
            {
              [stockField]: newStock,
              updatedAt: serverTimestamp(),
            }
          );

          finalPartsUsed.push({
            inventoryId:
              item.selectedPart.inventoryId,

            partName:
              item.selectedPart.partName,

            partNumber:
              item.selectedPart.partNumber || "",

            quantity:
              item.selectedPart.quantity,

            stockBefore:
              currentStock,

            stockAfter:
              newStock,

            minStock:
              Number(inventoryData.minStock ?? inventoryData.minimumStock ?? 0),
          });
        }

        // ------------------------------------------------------
        // SERVICE UPDATE
        // ------------------------------------------------------

        transaction.update(
          serviceRef,
          {
            status: "Completed",

            completedDate:
              serverTimestamp(),

            completedAt:
              serverTimestamp(),

            cost:
              Number(completionCost) || 0,

            partsUsed:
              finalPartsUsed,

            partsUsedText:
              finalPartsUsed.length > 0
                ? finalPartsUsed
                    .map(
                      (part) =>
                        `${part.partName} x${part.quantity}`
                    )
                    .join(", ")
                : "",

            inventoryDeducted: true,

            inventoryDeductedAt:
              finalPartsUsed.length > 0
                ? serverTimestamp()
                : null,

            assignedStaff:
              currentService.assignedStaff ||
              "",

            assignedStaffId:
              currentService.assignedStaffId ||
              null,

            updatedAt:
              serverTimestamp(),
          }
        );
      });

      // Notify admins when completing a service causes inventory to reach low stock.
      for (const part of selectedPartsData) {
        const matchingUsedPart = part;
        const updatedPart = inventory.find((item) => item.id === matchingUsedPart.inventoryId);
        const stockAfter = Number(matchingUsedPart.stockBefore) - Number(matchingUsedPart.quantity);
        const minStock = Number(updatedPart?.minStock ?? updatedPart?.minimumStock ?? 0);
        if (stockAfter <= minStock && Number(matchingUsedPart.stockBefore) > minStock) {
          await createAdminNotification({
            title: "Low Inventory Stock",
            message: `${matchingUsedPart.partName} has ${stockAfter} in stock (minimum: ${minStock}) after service completion.`,
            type: "inventory",
            route: "/admin/inventory",
            relatedId: matchingUsedPart.inventoryId,
          });
        }
      }

      // Notify the customer only after the completion transaction succeeds.
      await notifyServiceLifecycle(
        selectedService,
        "Service Completed",
        "Your motorcycle service has been completed. Thank you for choosing MPRSS!",
        "Completed"
      );

      setShowStatusModal(false);
      setSelectedService(null);
      setSelectedParts({});
    } catch (error) {
      console.error(
        "Error updating service:",
        error
      );

      alert(
        error?.message ||
          "Failed to update service."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  // ============================================================
  // PRINT
  // ============================================================

  const handlePrint = (service) => {
    const printWindow = window.open("", "_blank", "width=900,height=750");

    if (!printWindow) {
      alert("Please allow pop-ups to print this service invoice.");
      return;
    }

    // Escape all Firebase/user-provided values before writing them into the print document.
    const escapeHtml = (value) =>
      String(value ?? "—").replace(/[&<>"']/g, (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return entities[character];
      });

    const money = (value) =>
      `₱${(Number(value) || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const serviceId = service.id || "—";
    const status = getDisplayStatus(service);
    const completed = normalizeStatus(service.status) === "completed";
    const parts = Array.isArray(service.partsUsed)
      ? service.partsUsed
      : [];
    const partsRows = parts.length
      ? parts
          .map((part, index) => {
            const quantity = Math.max(0, Number(part.quantity) || 0);
            const unitPrice = Number(
              part.unitPrice ?? part.price ?? part.unitCost ?? part.costPerUnit
            );
            const hasUnitPrice = Number.isFinite(unitPrice) && unitPrice >= 0;
            const lineTotal = hasUnitPrice ? unitPrice * quantity : null;
            return `
              <tr>
                <td class="item-number">${index + 1}</td>
                <td>
                  <strong>${escapeHtml(part.partName || part.name || "Part")}</strong>
                  ${part.partNumber ? `<div class="muted small">Part No.: ${escapeHtml(part.partNumber)}</div>` : ""}
                </td>
                <td class="number">${quantity}</td>
                <td class="number">${hasUnitPrice ? money(unitPrice) : "—"}</td>
                <td class="number">${lineTotal === null ? "—" : money(lineTotal)}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="5" class="empty-row">No parts recorded for this service.</td></tr>`;

    const finalCost = Number(service.cost);
    const estimatedCost = Number(service.estimatedCost ?? service.cost ?? 0);
    const amountDue = completed && Number.isFinite(finalCost) && service.cost !== ""
      ? finalCost
      : estimatedCost;
    const requestDate = formatDate(service.requestDate || service.createdAt || service.dateRequested);
    const preferredDate = formatDate(service.preferredDate || service.scheduleDate || service.serviceDate);
    const printedDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const documentTitle = completed ? "Service Invoice" : "Service Work Order";

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${documentTitle} - ${escapeHtml(serviceId)}</title>
          <style>
            @page { size: A4; margin: 14mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #172033;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.45;
              background: #fff;
            }
            .document { max-width: 780px; margin: 0 auto; }
            .topbar { height: 7px; background: #111827; margin-bottom: 26px; }
            .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 22px; border-bottom: 2px solid #172033; }
            .shop-name { margin: 0 0 5px; font-size: 21px; letter-spacing: .4px; font-weight: 800; }
            .shop-subtitle { color: #64748b; font-size: 11px; }
            .document-title { margin: 0 0 7px; font-size: 23px; text-transform: uppercase; letter-spacing: .8px; text-align: right; }
            .status { display: inline-block; border: 1px solid #cbd5e1; border-radius: 20px; padding: 4px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .meta { text-align: right; margin-top: 8px; color: #475569; font-size: 11px; }
            .meta div { margin-top: 3px; }
            .section { margin-top: 24px; }
            .section-title { margin: 0 0 11px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 30px; }
            .detail { min-width: 0; }
            .label { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
            .value { font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
            .description { white-space: pre-wrap; overflow-wrap: anywhere; font-weight: 400; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            thead { display: table-header-group; }
            th { background: #f1f5f9; color: #334155; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; padding: 10px 8px; border-top: 1px solid #dbe2ea; border-bottom: 1px solid #dbe2ea; }
            td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr { page-break-inside: avoid; }
            .number { text-align: right; white-space: nowrap; }
            .item-number { width: 32px; color: #64748b; }
            .muted { color: #64748b; }
            .small { font-size: 10px; }
            .empty-row { color: #64748b; text-align: center; padding: 18px 8px; }
            .totals { width: 300px; max-width: 100%; margin: 18px 0 0 auto; }
            .total-line { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; color: #475569; }
            .total-line.grand { margin-top: 5px; padding: 12px 0; border-top: 2px solid #172033; color: #111827; font-size: 15px; font-weight: 800; }
            .notice { margin-top: 18px; padding: 11px 13px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 10px; }
            .footer { margin-top: 42px; padding-top: 13px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; gap: 18px; color: #64748b; font-size: 10px; }
            .signature { margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-line { border-top: 1px solid #94a3b8; padding-top: 6px; color: #64748b; font-size: 10px; }
            @media screen { body { background: #eef2f7; padding: 24px; } .document { background: white; padding: 30px; box-shadow: 0 8px 30px rgba(15,23,42,.08); } }
            @media print { body { background: white; } .document { max-width: none; } }
          </style>
        </head>
        <body>
          <main class="document">
            <div class="topbar"></div>
            <header class="header">
              <div>
                <h1 class="shop-name">10th Avenue Motorcycle Shop</h1>
                <div class="shop-subtitle">Motorcycle Service &amp; Maintenance</div>
              </div>
              <div>
                <h2 class="document-title">${documentTitle}</h2>
                <div style="text-align:right"><span class="status">${escapeHtml(status)}</span></div>
                <div class="meta">
                  <div><strong>Reference:</strong> ${escapeHtml(serviceId)}</div>
                  <div><strong>Printed:</strong> ${escapeHtml(printedDate)}</div>
                  <div><strong>Request date:</strong> ${escapeHtml(requestDate)}</div>
                </div>
              </div>
            </header>

            <section class="section">
              <h3 class="section-title">Customer &amp; Motorcycle Information</h3>
              <div class="details-grid">
                <div class="detail"><span class="label">Customer</span><div class="value">${escapeHtml(service.customerName || "Unknown Customer")}</div></div>
                <div class="detail"><span class="label">Customer Email</span><div class="value">${escapeHtml(service.customerEmail || service.email || "—")}</div></div>
                <div class="detail"><span class="label">Motorcycle</span><div class="value">${escapeHtml(service.motorcycleDisplay || formatMotorcycle(service.motorcycle) || "—")}</div></div>
                <div class="detail"><span class="label">Assigned Mechanic / Staff</span><div class="value">${escapeHtml(service.assignedStaff || service.assignedStaffName || "Not assigned")}</div></div>
              </div>
            </section>

            <section class="section">
              <h3 class="section-title">Service Details</h3>
              <div class="details-grid">
                <div class="detail"><span class="label">Service Type</span><div class="value">${escapeHtml(service.serviceType || "Motorcycle Service")}</div></div>
                <div class="detail"><span class="label">Scheduled / Preferred Date</span><div class="value">${escapeHtml(preferredDate)}</div></div>
                <div class="detail"><span class="label">Preferred Time</span><div class="value">${escapeHtml(service.preferredTime || service.scheduleTime || service.serviceTime || "—")}</div></div>
                <div class="detail"><span class="label">Estimated Duration</span><div class="value">${escapeHtml(service.estimatedTime || "—")}</div></div>
                <div class="detail"><span class="label">Payment Method</span><div class="value">${escapeHtml(service.paymentMethod || "Not selected")}</div></div>
                <div class="detail"><span class="label">Payment Status</span><div class="value">${escapeHtml(service.paymentStatus || "Not Yet Paid")}</div></div>
              </div>
              ${service.issueDescription ? `<div style="margin-top:17px"><span class="label">Reported Issue / Notes</span><div class="value description">${escapeHtml(service.issueDescription)}</div></div>` : ""}
            </section>

            <section class="section">
              <h3 class="section-title">Parts &amp; Materials</h3>
              <table>
                <thead><tr><th>#</th><th>Description</th><th class="number">Qty</th><th class="number">Unit Price</th><th class="number">Amount</th></tr></thead>
                <tbody>${partsRows}</tbody>
              </table>
              <div class="totals">
                <div class="total-line"><span>Estimated Cost</span><strong>${money(service.estimatedCost)}</strong></div>
                ${completed ? `<div class="total-line"><span>Final Service Cost</span><strong>${money(service.cost)}</strong></div>` : ""}
                <div class="total-line grand"><span>${completed ? "Total" : "Estimated Total"}</span><span>${money(amountDue)}</span></div>
              </div>
              ${!completed ? `<div class="notice">This is a service work order and cost estimate. Final charges may change after service completion.</div>` : `<div class="notice">Please retain this document for your service records. Part prices are shown only when recorded in the service data.</div>`}
            </section>

            <div class="signature">
              <div class="signature-line">Prepared / Authorized by</div>
              <div class="signature-line">Customer acknowledgment</div>
            </div>
            <footer class="footer"><span>10th Avenue Motorcycle Shop</span><span>Reference: ${escapeHtml(serviceId)}</span></footer>
          </main>
          <script>
            window.addEventListener("load", () => {
              setTimeout(() => { window.focus(); window.print(); }, 250);
            });
          </script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  // ============================================================
  // SERVICE CARD
  // ============================================================

  const renderServiceCard = (service, type) => {
    const status = getDisplayStatus(service);

    const isApproved =
      normalizeStatus(service.approvalStatus) ===
      "approved";

    const paymentMethodApproved =
      service.paymentMethodApproved === true;

    return (
      <div
        key={service.id}
        className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden"
      >
        <div className="lg:grid lg:grid-cols-[1fr_190px]">

          {/* LEFT CONTENT */}

          <div className="p-6">

            {/* Header */}

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {service.serviceType ||
                  "Motorcycle Service"}
              </h3>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : status === "Rejected"
                    ? "bg-red-100 text-red-700"
                    : status === "Waiting for Parts"
                    ? "bg-amber-100 text-amber-700"
                    : status === "Quality Check"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Details */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Customer
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {service.customerName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Motorcycle
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {service.motorcycleDisplay}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Request Date
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {formatDate(service.requestDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Preferred Date
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {formatDate(service.preferredDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Preferred Time
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {service.preferredTime || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Payment Method
                </p>

                <p className="text-sm font-semibold text-gray-900">
                  {service.paymentMethod ||
                    "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Payment Method Approval
                </p>

                <p
                  className={`text-sm font-semibold ${
                    service.paymentMethodApproved ===
                    true
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {service.paymentMethodApproved ===
                  true
                    ? "Approved"
                    : "Pending"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Payment Status
                </p>

                <p className="text-sm font-semibold text-gray-700">
                  {service.paymentStatus ||
                    "Not Yet Paid"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Estimated Cost
                </p>

                <p className="text-sm font-semibold text-gray-900">
                  {service.estimatedCost
                    ? `₱${Number(
                        service.estimatedCost
                      ).toLocaleString()}`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Estimated Time
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {service.estimatedTime ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Assigned Staff
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {service.assignedStaff || "—"}
                </p>
              </div>
            </div>

            {/* Issue Description */}

            {service.issueDescription && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Issue Description
                </p>

                <p className="text-sm text-gray-700 leading-relaxed">
                  {service.issueDescription}
                </p>
              </div>
            )}

            {/* Completed Parts */}

            {status === "Completed" &&
              Array.isArray(service.partsUsed) &&
              service.partsUsed.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                    Parts Used
                  </p>

                  <div className="space-y-1">
                    {service.partsUsed.map(
                      (part, index) => (
                        <div
                          key={`${part.inventoryId || "part"}-${index}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-800">
                            {part.partName}
                          </span>

                          <span className="font-semibold text-gray-900">
                            ×{part.quantity}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* RIGHT ACTIONS */}

          <div className="border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Actions
            </p>

            <div className="space-y-2">

              {/* REQUEST ACTIONS */}

              {type === "request" && (
                <>
                  {!isApproved && (
                    <>
                      <button
                        onClick={() =>
                          handleApprove(service)
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a0f1a] text-white text-sm font-semibold hover:bg-gray-800 transition"
                      >
                        <Check size={16} />
                        Approve Service
                      </button>

                      <button
                        onClick={() =>
                          handleReject(service)
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </>
                  )}

                  {isApproved &&
                    !paymentMethodApproved && (
                      <button
                        onClick={() =>
                          handleApprovePaymentMethod(
                            service
                          )
                        }
                        disabled={
                          !service.paymentMethod
                        }
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                          service.paymentMethod
                            ? "border border-green-200 bg-white text-green-600 hover:bg-green-50"
                            : "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <CheckCircle size={16} />
                        Approve Payment Method
                      </button>
                    )}

                  {isApproved &&
                    paymentMethodApproved && (
                      <button
                        onClick={() =>
                          handleActivate(service)
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        <Play size={16} />
                        Start Service
                      </button>
                    )}
                </>
              )}

              {/* ACTIVE ACTIONS */}

              {type === "active" && (
                <>
                  <button
                    onClick={() =>
                      handleOpenStatusModal(
                        service
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a0f1a] text-white text-sm font-semibold hover:bg-gray-800 transition"
                  >
                    <Clock size={16} />
                    Update Status
                  </button>

                  <button
                    onClick={() =>
                      handlePrint(service)
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100 transition"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                </>
              )}

              {/* COMPLETED ACTIONS */}

              {type === "completed" && (
                <button
                  onClick={() =>
                    handlePrint(service)
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100 transition"
                >
                  <Printer size={16} />
                  Print
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // TAB DATA
  // ============================================================

  const currentServices =
    activeTab === "requests"
      ? serviceRequests
      : activeTab === "active"
      ? activeServices
      : completedServices;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AdminLayout title="Services">
      <div className="min-h-screen bg-[#f8fafc] p-6">

        {/* TABS */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() =>
                setActiveTab("requests")
              }
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "requests"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Requests
              <span className="ml-2 text-xs">
                ({serviceRequests.length})
              </span>
            </button>

            <button
              onClick={() =>
                setActiveTab("active")
              }
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "active"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Active
              <span className="ml-2 text-xs">
                ({activeServices.length})
              </span>
            </button>

            <button
              onClick={() =>
                setActiveTab("completed")
              }
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "completed"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Completed
              <span className="ml-2 text-xs">
                ({completedServices.length})
              </span>
            </button>
          </div>
        </div>

        {/* SERVICE LIST */}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading services...
            </p>
          </div>
        ) : currentServices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle
              size={42}
              className="mx-auto text-gray-300 mb-3"
            />

            <h3 className="text-base font-semibold text-gray-800">
              No services found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              There are no services in this section.
            </p>
          </div>
        ) : (
          currentServices.map((service) =>
            renderServiceCard(
              service,
              activeTab === "requests"
                ? "request"
                : activeTab === "active"
                ? "active"
                : "completed"
            )
          )
        )}

        {/* ===================================================== */}
        {/* APPROVAL MODAL */}
        {/* ===================================================== */}

        {showApprovalModal &&
          selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Approve Service Request
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Set the estimated cost, time, and
                      assigned staff.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowApprovalModal(false)
                    }
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5">

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Service
                    </p>

                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedService.serviceType ||
                        "Motorcycle Service"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {selectedService.customerName}{" "}
                      •{" "}
                      {
                        selectedService.motorcycleDisplay
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Cost
                    </label>

                    <select
                      value={estimatedCost}
                      onChange={(e) =>
                        setEstimatedCost(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">
                        Select estimated cost
                      </option>

                      {estimatedCostOptions.map(
                        (cost) => (
                          <option
                            key={cost}
                            value={cost}
                          >
                            ₱
                            {cost.toLocaleString()}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Time
                    </label>

                    <select
                      value={estimatedTime}
                      onChange={(e) =>
                        setEstimatedTime(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">
                        Select estimated time
                      </option>

                      {estimatedTimeOptions.map(
                        (time) => (
                          <option
                            key={time}
                            value={time}
                          >
                            {time}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigned Staff
                    </label>

                    <select
                      value={assignedStaffId}
                      onChange={(e) => {
                        const staffId =
                          e.target.value;

                        setAssignedStaffId(
                          staffId
                        );

                        const person =
                          mechanics.find(
                            (item) =>
                              item.id === staffId
                          );

                        setAssignedStaff(
                          person?.fullName ||
                            person?.name ||
                            ""
                        );
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">
                        Select mechanic / staff
                      </option>

                      {mechanics.map((person) => (
                        <option
                          key={person.id}
                          value={person.id}
                        >
                          {person.fullName ||
                            person.name ||
                            person.email ||
                            "Unnamed Staff"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedService(null);
                    }}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveApproval}
                    className="px-5 py-2.5 rounded-lg bg-[#0a0f1a] text-white text-sm font-semibold hover:bg-gray-800"
                  >
                    Approve Service
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ===================================================== */}
        {/* REJECT MODAL */}
        {/* ===================================================== */}

        {showRejectModal &&
          selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">
                    Reject Service Request
                  </h2>

                  <button
                    onClick={() =>
                      setShowRejectModal(false)
                    }
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Enter the reason for rejecting this request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() =>
                      setShowRejectModal(false)
                    }
                    className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveRejection}
                    className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ===================================================== */}
        {/* STATUS MODAL */}
        {/* ===================================================== */}

        {showStatusModal &&
          selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* MODAL HEADER */}

                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Update Service Status
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Update the current service progress.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowStatusModal(false)
                    }
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* MODAL BODY */}

                <div className="p-6 space-y-5 overflow-y-auto">

                  {/* STATUS */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>

                    <select
                      value={newStatus}
                      onChange={(e) =>
                        setNewStatus(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Waiting for Parts">
                        Waiting for Parts
                      </option>

                      <option value="Quality Check">
                        Quality Check
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>
                  </div>

                  {/* COMPLETION FIELDS */}

                  {normalizeStatus(
                    newStatus
                  ) === "completed" && (
                    <>
                      {/* FINAL COST */}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Final Cost
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={completionCost}
                          onChange={(e) =>
                            setCompletionCost(
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>

                      {/* PARTS USED */}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Parts Used
                            </label>

                            <p className="text-xs text-gray-500 mt-1">
                              Select parts from inventory and enter the quantity used.
                            </p>
                          </div>

                          {Object.keys(
                            selectedParts
                          ).length > 0 && (
                            <span className="text-xs font-semibold text-gray-600">
                              {
                                Object.keys(
                                  selectedParts
                                ).length
                              } selected
                            </span>
                          )}
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {inventory.length === 0 ? (
                            <div className="p-5 text-center">
                              <p className="text-sm font-medium text-gray-700">
                                No inventory parts available
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                Add parts to inventory first.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {inventory.map(
                                (part) => {
                                  const partName =
                                    getInventoryPartName(
                                      part
                                    );

                                  const partNumber =
                                    getInventoryPartNumber(
                                      part
                                    );

                                  const stock =
                                    getInventoryStock(
                                      part
                                    );

                                  const isSelected =
                                    Boolean(
                                      selectedParts[
                                        part.id
                                      ]
                                    );

                                  const quantity =
                                    selectedParts[
                                      part.id
                                    ]?.quantity ||
                                    1;

                                  const insufficient =
                                    isSelected &&
                                    quantity >
                                      stock;

                                  return (
                                    <div
                                      key={
                                        part.id
                                      }
                                      className={`p-4 transition ${
                                        isSelected
                                          ? "bg-gray-50"
                                          : "bg-white"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <input
                                          type="checkbox"
                                          checked={
                                            isSelected
                                          }
                                          onChange={() =>
                                            handlePartToggle(
                                              part
                                            )
                                          }
                                          disabled={
                                            stock <=
                                            0
                                          }
                                          className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        />

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-sm font-semibold text-gray-900">
                                                {
                                                  partName
                                                }
                                              </p>

                                              {partNumber && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                  {
                                                    partNumber
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <span
                                              className={`text-xs font-semibold whitespace-nowrap ${
                                                stock <=
                                                0
                                                  ? "text-red-600"
                                                  : stock <=
                                                    5
                                                  ? "text-amber-600"
                                                  : "text-green-600"
                                              }`}
                                            >
                                              Stock:{" "}
                                              {
                                                stock
                                              }
                                            </span>
                                          </div>

                                          {isSelected && (
                                            <div className="mt-3 flex items-center gap-3">
                                              <label className="text-xs font-medium text-gray-600">
                                                Quantity
                                              </label>

                                              <input
                                                type="number"
                                                min="1"
                                                max={
                                                  stock
                                                }
                                                value={
                                                  quantity
                                                }
                                                onChange={(
                                                  e
                                                ) =>
                                                  handlePartQuantityChange(
                                                    part.id,
                                                    e
                                                      .target
                                                      .value
                                                  )
                                                }
                                                className={`w-24 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                                                  insufficient
                                                    ? "border-red-400 bg-red-50"
                                                    : "border-gray-300"
                                                }`}
                                              />

                                              <span className="text-xs text-gray-500">
                                                of{" "}
                                                {
                                                  stock
                                                }{" "}
                                                available
                                              </span>
                                            </div>
                                          )}

                                          {insufficient && (
                                            <p className="text-xs text-red-600 mt-2">
                                              Quantity exceeds available stock.
                                            </p>
                                          )}

                                          {stock <=
                                            0 && (
                                            <p className="text-xs text-red-600 mt-2">
                                              Out of stock
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>

                        {/* SELECTED PART SUMMARY */}

                        {Object.keys(
                          selectedParts
                        ).length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              Selected Parts
                            </p>

                            <div className="space-y-1.5">
                              {getSelectedPartsData().map(
                                (part) => (
                                  <div
                                    key={
                                      part.inventoryId
                                    }
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-700">
                                      {
                                        part.partName
                                      }
                                    </span>

                                    <span className="font-semibold text-gray-900">
                                      ×
                                      {
                                        part.quantity
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* INVENTORY NOTICE */}

                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-800">
                          Inventory Update
                        </p>

                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                          When this service is marked as completed,
                          the selected quantities will automatically
                          be deducted from the inventory stock.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* MODAL FOOTER */}

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <button
                    onClick={() =>
                      setShowStatusModal(false)
                    }
                    disabled={savingStatus}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveStatus}
                    disabled={savingStatus}
                    className="px-5 py-2.5 rounded-lg bg-[#0a0f1a] text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingStatus
                      ? "Saving..."
                      : "Save Status"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;