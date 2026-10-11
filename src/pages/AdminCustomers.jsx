import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  Search,
  MessageSquare,
  History,
  X,
  User,
  Mail,
  Phone,
  CalendarDays,
  Bike,
  PhilippinePeso,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

function AdminCustomers() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [services, setServices] = useState([]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);

  /*
   * ============================================================
   * FIREBASE DATA
   * ============================================================
   */

  useEffect(() => {
    /*
     * Customers
     *
     * The customer mobile app stores registered customers in:
     *
     * customers/{uid}
     *
     * We also listen to users for compatibility with any older
     * customer records that may still exist there.
     */
    const unsubscribeCustomers = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const customerUsers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => {
            return (
              String(user.role || "customer").toLowerCase() ===
              "customer"
            );
          });

        setUsers((previousUsers) => {
          const previousNonCustomers = previousUsers.filter(
            (user) => user.__source !== "customers"
          );

          return [
            ...previousNonCustomers,
            ...customerUsers.map((user) => ({
              ...user,
              __source: "customers",
            })),
          ];
        });

        setLoadingCustomers(false);
      },
      (error) => {
        console.error("Error loading customers:", error);
        setLoadingCustomers(false);
      }
    );

    /*
     * Legacy users collection support.
     */
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const customerUsers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => {
            return (
              String(user.role || "").toLowerCase() ===
              "customer"
            );
          });

        setUsers((previousUsers) => {
          const currentCustomers = previousUsers.filter(
            (user) => user.__source === "customers"
          );

          const usersCollection = customerUsers.map((user) => ({
            ...user,
            __source: "users",
          }));

          return [...currentCustomers, ...usersCollection];
        });
      },
      (error) => {
        console.error("Error loading users:", error);
      }
    );

    const unsubscribeMotorcycles = onSnapshot(
      collection(db, "motorcycles"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMotorcycles(data);
      },
      (error) => {
        console.error("Error loading motorcycles:", error);
        setMotorcycles([]);
      }
    );

    const unsubscribeServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(data);
      },
      (error) => {
        console.error("Error loading services:", error);
        setServices([]);
      }
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeUsers();
      unsubscribeMotorcycles();
      unsubscribeServices();
    };
  }, []);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    try {
      if (typeof value?.toDate === "function") {
        return value.toDate().toLocaleDateString("en-PH");
      }

      if (value instanceof Date) {
        return value.toLocaleDateString("en-PH");
      }

      const parsedDate = new Date(value);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-PH");
      }

      return String(value);
    } catch {
      return String(value);
    }
  };

  const getTimestamp = (value) => {
    if (!value) {
      return 0;
    }

    try {
      if (typeof value?.toDate === "function") {
        return value.toDate().getTime();
      }

      if (value instanceof Date) {
        return value.getTime();
      }

      const parsedDate = new Date(value).getTime();

      return Number.isNaN(parsedDate) ? 0 : parsedDate;
    } catch {
      return 0;
    }
  };

  const getCustomerMotorcycles = (customer) => {
    return motorcycles.filter((motorcycle) => {
      const ownerId =
        motorcycle.userId ||
        motorcycle.customerId ||
        motorcycle.ownerId ||
        motorcycle.userUid ||
        motorcycle.customerUid;

      if (ownerId && ownerId === customer.id) {
        return true;
      }

      if (
        motorcycle.userEmail &&
        customer.email &&
        motorcycle.userEmail.toLowerCase() ===
          customer.email.toLowerCase()
      ) {
        return true;
      }

      if (
        motorcycle.customerEmail &&
        customer.email &&
        motorcycle.customerEmail.toLowerCase() ===
          customer.email.toLowerCase()
      ) {
        return true;
      }

      return false;
    });
  };

  const serviceBelongsToCustomer = (service, customer) => {
    const customerId =
      service.customerId ||
      service.userId ||
      service.userUid ||
      service.customerUid ||
      service.uid;

    if (customerId && customerId === customer.id) {
      return true;
    }

    if (
      service.customerEmail &&
      customer.email &&
      service.customerEmail.toLowerCase() ===
        customer.email.toLowerCase()
    ) {
      return true;
    }

    if (
      service.userEmail &&
      customer.email &&
      service.userEmail.toLowerCase() ===
        customer.email.toLowerCase()
    ) {
      return true;
    }

    return false;
  };

  const getCustomerServices = (customer) => {
    return services
      .filter((service) =>
        serviceBelongsToCustomer(service, customer)
      )
      .sort((a, b) => {
        const dateA =
          getTimestamp(a.completedAt) ||
          getTimestamp(a.completedDate) ||
          getTimestamp(a.createdAt) ||
          getTimestamp(a.requestDate);

        const dateB =
          getTimestamp(b.completedAt) ||
          getTimestamp(b.completedDate) ||
          getTimestamp(b.createdAt) ||
          getTimestamp(b.requestDate);

        return dateB - dateA;
      });
  };

  const getServiceAmount = (service) => {
    return Number(
      service.amount ??
        service.finalCost ??
        service.cost ??
        service.actualCost ??
        service.estimatedCost ??
        0
    );
  };

  const getCustomerData = (customer) => {
    const customerMotorcycles =
      getCustomerMotorcycles(customer);

    const customerServices =
      getCustomerServices(customer);

    const completedServices = customerServices.filter(
      (service) => {
        const status = String(service.status || "")
          .toLowerCase()
          .replace(/_/g, " ")
          .trim();

        return status === "completed";
      }
    );

    const totalSpent = completedServices.reduce(
      (total, service) => {
        return total + getServiceAmount(service);
      },
      0
    );

    const serviceHistoryDetails =
      completedServices.map((service) => ({
        id: service.id,

        date:
          formatDate(service.completedAt) ||
          formatDate(service.completedDate) ||
          formatDate(service.createdAt) ||
          formatDate(service.requestDate) ||
          "—",

        serviceType:
          service.serviceType ||
          service.serviceName ||
          service.type ||
          "Service",

        amount: getServiceAmount(service),
      }));

    return {
      id: customer.id,

      name:
        customer.fullName ||
        customer.name ||
        "Unnamed Customer",

      email: customer.email || "",

      mobile:
        customer.mobile ||
        customer.mobileNumber ||
        customer.phone ||
        "",

      registeredDate:
        formatDate(customer.createdAt) ||
        formatDate(customer.registeredAt) ||
        formatDate(customer.dateRegistered) ||
        "—",

      motorcycles: customerMotorcycles,

      serviceHistory: completedServices.length,

      totalSpent,

      serviceHistoryDetails,
    };
  };

  /*
   * Remove duplicate customers when the same customer exists
   * in both customers and users collections.
   */
  const customers = useMemo(() => {
    const customerMap = new Map();

    users.forEach((user) => {
      const key =
        user.id ||
        String(user.email || "").toLowerCase();

      if (!key) return;

      /*
       * Prefer the new customers collection.
       */
      if (
        !customerMap.has(key) ||
        user.__source === "customers"
      ) {
        customerMap.set(key, user);
      }
    });

    return Array.from(customerMap.values())
      .map(getCustomerData)
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [users, motorcycles, services]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.mobile
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const handleSendMessage = async () => {
    if (!selectedCustomer?.id) {
      return;
    }

    const message = messageText.trim();

    if (!message) {
      return;
    }

    setMessageLoading(true);

    try {
      /*
       * Save the message as a notification for the customer.
       *
       * This matches the customer app notification structure:
       *
       * customerId
       * type
       * title
       * message
       * route
       * read
       * createdAt
       */
      await addDoc(collection(db, "notifications"), {
        customerId: selectedCustomer.id,
        customerUid: selectedCustomer.id,
        customerEmail: selectedCustomer.email || "",

        type: "message",

        title: "Message from Admin",

        message,

        route: "/messages",

        read: false,

        createdAt: serverTimestamp(),
      });

      setMessageText("");
      setShowMessageModal(false);

      alert("Message sent successfully.");
    } catch (error) {
      console.error("Error sending customer message:", error);

      alert(
        "Unable to send the message. Please try again."
      );
    } finally {
      setMessageLoading(false);
    }
  };

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <AdminLayout title="Customers">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* =====================================================
            CUSTOMER LIST
        ====================================================== */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Customers
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {customers.length} registered customer
                  {customers.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={18} className="text-gray-600" />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition"
              />
            </div>
          </div>

          {/* Customer Items */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "calc(100vh - 270px)",
            }}
          >
            {loadingCustomers ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-3" />

                <p className="text-sm text-gray-500">
                  Loading customers...
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <User
                    size={20}
                    className="text-gray-400"
                  />
                </div>

                <p className="text-sm font-medium text-gray-700">
                  No customers found
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Try a different search term.
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() =>
                    setSelectedCustomer(customer)
                  }
                  className={`w-full text-left p-4 border-b border-gray-100 transition ${
                    selectedCustomer?.id === customer.id
                      ? "bg-gray-100 border-l-4 border-l-black"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-semibold ${
                        selectedCustomer?.id ===
                        customer.id
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {customer.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {customer.name}
                      </p>

                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {customer.email ||
                          "No email address"}
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          {customer.motorcycles.length}{" "}
                          motorcycle
                          {customer.motorcycles.length !==
                          1
                            ? "s"
                            : ""}
                        </span>

                        <span className="text-xs text-gray-400">
                          {customer.serviceHistory}{" "}
                          service
                          {customer.serviceHistory !==
                          1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* =====================================================
            CUSTOMER DETAILS
        ====================================================== */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-5">

              {/* Customer Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-semibold">
                      {selectedCustomer.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedCustomer.name}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {selectedCustomer.email ||
                          "No email address"}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center w-fit px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    Active Customer
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <User
                    size={18}
                    className="text-gray-500"
                  />

                  <h3 className="font-semibold text-gray-900">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <User
                        size={16}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Full Name
                      </p>

                      <p className="font-medium text-gray-900">
                        {selectedCustomer.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail
                        size={16}
                        className="text-gray-600"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        Email
                      </p>

                      <p className="font-medium text-gray-900 break-all">
                        {selectedCustomer.email ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Phone
                        size={16}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Mobile
                      </p>

                      <p className="font-medium text-gray-900">
                        {selectedCustomer.mobile ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <CalendarDays
                        size={16}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Registered Date
                      </p>

                      <p className="font-medium text-gray-900">
                        {selectedCustomer.registeredDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        Motorcycles
                      </p>

                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {selectedCustomer.motorcycles.length}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Bike
                        size={19}
                        className="text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        Completed Services
                      </p>

                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {selectedCustomer.serviceHistory}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <History
                        size={19}
                        className="text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        Total Spent
                      </p>

                      <p className="text-xl font-semibold text-gray-900 mt-1">
                        ₱
                        {selectedCustomer.totalSpent.toLocaleString()}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <PhilippinePeso
                        size={19}
                        className="text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Motorcycles */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Registered Motorcycles
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Motorcycles registered by this customer
                    </p>
                  </div>

                  <Bike
                    size={20}
                    className="text-gray-400"
                  />
                </div>

                {selectedCustomer.motorcycles.length ===
                0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Bike
                      size={24}
                      className="mx-auto text-gray-300 mb-2"
                    />

                    <p className="text-sm font-medium text-gray-600">
                      No motorcycles registered
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.motorcycles.map(
                      (moto) => (
                        <div
                          key={moto.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Bike
                                  size={18}
                                  className="text-gray-600"
                                />
                              </div>

                              <div>
                                <p className="font-medium text-gray-900">
                                  {moto.brand}{" "}
                                  {moto.model}
                                </p>

                                <p className="text-sm text-gray-500 mt-0.5">
                                  {moto.year}{" "}
                                  {moto.color
                                    ? `• ${moto.color}`
                                    : ""}
                                </p>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-xs text-gray-500">
                                Plate Number
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {moto.plate || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Service History Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <History
                    size={18}
                    className="text-gray-500"
                  />

                  <h3 className="font-semibold text-gray-900">
                    Service History
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Total Completed Services
                    </p>

                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      {selectedCustomer.serviceHistory}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Total Spent
                    </p>

                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      ₱
                      {selectedCustomer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Customer Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                    onClick={() =>
                      setShowMessageModal(true)
                    }
                  >
                    <MessageSquare size={17} />
                    Send Message
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                    onClick={() =>
                      setShowHistoryModal(true)
                    }
                  >
                    <History size={17} />
                    View Full History
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex items-center justify-center">
              <div className="text-center max-w-sm px-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <User
                    size={28}
                    className="text-gray-400"
                  />
                </div>

                <h3 className="font-semibold text-gray-800">
                  Select a customer
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Choose a customer from the list to view
                  their personal information, motorcycles,
                  service history, and available actions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =======================================================
          HISTORY MODAL
      ======================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Service History
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {selectedCustomer?.name}
                </p>
              </div>

              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                onClick={() =>
                  setShowHistoryModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {selectedCustomer?.serviceHistoryDetails
                .length === 0 ? (
                <div className="text-center py-10">
                  <History
                    size={28}
                    className="mx-auto text-gray-300 mb-3"
                  />

                  <p className="text-sm font-medium text-gray-600">
                    No completed service history
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer?.serviceHistoryDetails.map(
                    (service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">
                                REF
                              </span>

                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {service.id}
                              </span>
                            </div>

                            <p className="font-medium text-gray-900">
                              {service.serviceType}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              Completed: {service.date}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs text-gray-500">
                              Amount
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                              ₱
                              {service.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MESSAGE MODAL
      ======================================================== */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MessageSquare
                    size={19}
                    className="text-gray-700"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send Message
                  </h3>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Send a notification to the customer
                  </p>
                </div>
              </div>

              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                onClick={() =>
                  setShowMessageModal(false)
                }
                disabled={messageLoading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">
                  Recipient
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {selectedCustomer?.name}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedCustomer?.email}
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>

              <textarea
                value={messageText}
                onChange={(e) =>
                  setMessageText(e.target.value)
                }
                className="w-full min-h-[130px] resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
                placeholder="Type your message here..."
                disabled={messageLoading}
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText("");
                  }}
                  disabled={messageLoading}
                >
                  Cancel
                </button>

                <button
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition ${
                    messageText.trim() && !messageLoading
                      ? "bg-black hover:bg-gray-800"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={handleSendMessage}
                  disabled={
                    !messageText.trim() || messageLoading
                  }
                >
                  <Send size={16} />

                  {messageLoading
                    ? "Sending..."
                    : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCustomers;