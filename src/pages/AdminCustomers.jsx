import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Search, MessageSquare, History, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function AdminCustomers() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const customerUsers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => {
            return String(user.role || "").toLowerCase() === "customer";
          });

        setUsers(customerUsers);
      },
      (error) => {
        console.error("Error loading customers:", error);
        setUsers([]);
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
      unsubscribeUsers();
      unsubscribeMotorcycles();
      unsubscribeServices();
    };
  }, []);

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
      service.customerEmail.toLowerCase() === customer.email.toLowerCase()
    ) {
      return true;
    }

    if (
      service.userEmail &&
      customer.email &&
      service.userEmail.toLowerCase() === customer.email.toLowerCase()
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
    const customerMotorcycles = getCustomerMotorcycles(customer);
    const customerServices = getCustomerServices(customer);

    const completedServices = customerServices.filter((service) => {
      const status = String(service.status || "")
        .toLowerCase()
        .replace(/_/g, " ")
        .trim();

      return status === "completed";
    });

    const totalSpent = completedServices.reduce((total, service) => {
      return total + getServiceAmount(service);
    }, 0);

    const serviceHistoryDetails = completedServices.map((service) => ({
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

      email:
        customer.email ||
        "",

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

  const customers = users.map(getCustomerData);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    setShowMessageModal(false);
    navigate("/admin/messages");
  };

  return (
    <AdminLayout title="Customers">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Customer List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>

          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 250px)" }}
          >
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedCustomer?.id === customer.id ? "bg-gray-50" : ""
                }`}
              >
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {customer.mobile}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">

              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg mb-4">
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Full Name
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Email
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Mobile
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.mobile}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">
                      Registered Date
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.registeredDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registered Motorcycles */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg mb-4">
                  Registered Motorcycles
                </h3>

                <div className="space-y-3">
                  {selectedCustomer.motorcycles.map((moto) => (
                    <div
                      key={moto.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {moto.brand} {moto.model}
                          </p>

                          <p className="text-sm text-gray-600">
                            Year: {moto.year}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Plate
                          </p>

                          <p className="font-medium">
                            {moto.plate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service History Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg mb-4">
                  Service History
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Total Services
                    </p>

                    <p className="text-2xl">
                      {selectedCustomer.serviceHistory}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Total Spent
                    </p>

                    <p className="text-2xl">
                      ₱{selectedCustomer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg mb-4">
                  Actions
                </h3>

                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    onClick={() => setShowMessageModal(true)}
                  >
                    <MessageSquare size={18} />
                    Send Message
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    onClick={() => setShowHistoryModal(true)}
                  >
                    <History size={18} />
                    View Full History
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Select a customer to view details
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-1/2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Service History
              </h3>

              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowHistoryModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCustomer?.serviceHistoryDetails.map(
                (service) => (
                  <div
                    key={service.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          REF:
                        </span>

                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {service.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {service.date}
                        </p>

                        <p className="text-sm text-gray-600">
                          Service: {service.serviceType}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Amount
                        </p>

                        <p className="font-medium">
                          ₱{service.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-1/2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Send Message
              </h3>

              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowMessageModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Recipient: {selectedCustomer?.name}
              </p>

              <textarea
                className="w-full h-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Type your message here..."
              />

              <button
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                onClick={handleSendMessage}
              >
                <MessageSquare size={18} />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCustomers;