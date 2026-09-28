import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  Users,
  Wrench,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const todayStr = new Date().toISOString().split("T")[0];

const DAILY_CAPACITY = 5;

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
];

function AdminSchedule() {
  const [shopSchedule, setShopSchedule] = useState({
    dailyCapacity: DAILY_CAPACITY,
    timeSlots: TIME_SLOTS,
    bookedSlots: {},
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    timeSlot: "",
    reason: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);

  const [addForm, setAddForm] = useState({
    customerId: "",
    customerName: "",
    motorcycleId: "",
    motorcycle: "",
    serviceType: "",
    date: todayStr,
    time: "",
    assignedStaff: "",
    assignedStaffId: "",
    notes: "",
    otherBrand: "",
    otherModel: "",
    otherPlate: "",
    otherYear: "",
  });

  const [addCustomerMotorcycles, setAddCustomerMotorcycles] =
    useState([]);

  const [users, setUsers] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [blockedSchedules, setBlockedSchedules] = useState({});

  /*
   * ============================================================
   * FIRESTORE REAL-TIME DATA
   * ============================================================
   */

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setUsers(data);
      },
      (error) => {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    );

    const unsubscribeMotorcycles = onSnapshot(
      collection(db, "motorcycles"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
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
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setAllServices(data);
      },
      (error) => {
        console.error("Error loading services:", error);
        setAllServices([]);
      }
    );

    const unsubscribeStaff = onSnapshot(
      collection(db, "staff"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setStaff(data);
      },
      (error) => {
        console.error("Error loading staff:", error);
        setStaff([]);
      }
    );

    const unsubscribeSchedules = onSnapshot(
      collection(db, "schedules"),
      (snapshot) => {
        const bookedSlots = {};
        const blockedSlots = {};

        snapshot.docs.forEach((scheduleDoc) => {
          const scheduleData = scheduleDoc.data();
          const date =
            scheduleData.date || scheduleDoc.id;

          bookedSlots[date] =
            scheduleData.bookedSlots || {};

          if (
            scheduleData.blockedSlots &&
            Object.keys(scheduleData.blockedSlots).length > 0
          ) {
            blockedSlots[date] =
              scheduleData.blockedSlots;
          }
        });

        setShopSchedule({
          dailyCapacity: DAILY_CAPACITY,
          timeSlots: TIME_SLOTS,
          bookedSlots,
        });

        setBlockedSchedules(blockedSlots);
      },
      (error) => {
        console.error("Error loading schedules:", error);

        setShopSchedule({
          dailyCapacity: DAILY_CAPACITY,
          timeSlots: TIME_SLOTS,
          bookedSlots: {},
        });

        setBlockedSchedules({});
      }
    );

    const unsubscribeHolidays = onSnapshot(
      collection(db, "holidays"),
      (snapshot) => {
        const data = snapshot.docs.map((holidayDoc) => ({
          id: holidayDoc.id,
          ...holidayDoc.data(),
        }));

        setHolidays(data);
      },
      (error) => {
        console.error("Error loading holidays:", error);
        setHolidays([]);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeMotorcycles();
      unsubscribeServices();
      unsubscribeStaff();
      unsubscribeSchedules();
      unsubscribeHolidays();
    };
  }, []);

  /*
   * ============================================================
   * CUSTOMER DATA
   * ============================================================
   */

  const allCustomers = users
    .filter(
      (user) =>
        String(user.role || "").toLowerCase() ===
        "customer"
    )
    .map((customer) => ({
      ...customer,
      name:
        customer.fullName ||
        customer.name ||
        customer.email ||
        "Customer",
    }));

  /*
   * ============================================================
   * STAFF DATA
   * ============================================================
   */

  const mechanics = staff.map((staffMember) => ({
    id: staffMember.id,

    name:
      staffMember.name ||
      staffMember.fullName ||
      staffMember.email ||
      "Staff",

    position:
      staffMember.position ||
      "Staff",

    available:
      String(
        staffMember.status || "active"
      ).toLowerCase() !== "inactive" &&
      staffMember.available !== false,
  }));

  /*
   * ============================================================
   * STAFF AVAILABILITY FOR SELECTED DATE / TIME
   * ============================================================
   */

  const availableMechanicsForAdd = mechanics.filter((mechanic) => {
    if (!mechanic.available) {
      return false;
    }

    // Before a time is selected, show all active staff.
    if (!addForm.date || !addForm.time) {
      return true;
    }

    const hasConflict = allServices.some((service) => {
      const status = String(service.status || "").toLowerCase().trim();
      const approvalStatus = String(service.approvalStatus || "")
        .toLowerCase()
        .trim();

      // Rejected services do not occupy a staff slot.
      if (status === "rejected" || approvalStatus === "rejected") {
        return false;
      }

      const serviceDate =
        service.preferredDate ||
        service.date ||
        service.scheduleDate ||
        service.requestDate ||
        "";

      const serviceTime =
        service.preferredTime ||
        service.time ||
        service.scheduleTime ||
        "";

      if (serviceDate !== addForm.date || serviceTime !== addForm.time) {
        return false;
      }

      return (
        service.assignedStaffId === mechanic.id ||
        service.assignedStaff === mechanic.name
      );
    });

    return !hasConflict;
  });

  /*
   * ============================================================
   * DATA HELPERS
   * ============================================================
   */

  const getCustomerById = (customerId) => {
    if (!customerId) return null;

    return users.find(
      (user) => user.id === customerId
    );
  };

  const getCustomerForRecord = (record) => {
    const customerId =
      record.customerId ||
      record.userId ||
      record.userUid ||
      record.customerUid;

    if (customerId) {
      return getCustomerById(customerId);
    }

    if (record.customerEmail) {
      return users.find(
        (user) =>
          String(user.email || "").toLowerCase() ===
          String(record.customerEmail).toLowerCase()
      );
    }

    if (record.userEmail) {
      return users.find(
        (user) =>
          String(user.email || "").toLowerCase() ===
          String(record.userEmail).toLowerCase()
      );
    }

    return null;
  };

  const getMotorcycleForRecord = (record) => {
    if (
      record.motorcycle &&
      typeof record.motorcycle === "object"
    ) {
      return record.motorcycle;
    }

    const motorcycleId =
      record.motorcycleId;

    if (motorcycleId) {
      return motorcycles.find(
        (motorcycle) =>
          motorcycle.id === motorcycleId
      );
    }

    return null;
  };

  const getMotorcycleOwnerId = (motorcycle) => {
    return (
      motorcycle.customerId ||
      motorcycle.userId ||
      motorcycle.ownerId ||
      motorcycle.userUid ||
      motorcycle.customerUid ||
      ""
    );
  };

  const formatMotorcycle = (motorcycle) => {
    if (!motorcycle) return "";

    if (typeof motorcycle === "string") {
      return motorcycle;
    }

    const values = [
      motorcycle.brand,
      motorcycle.model,
    ].filter(Boolean);

    if (motorcycle.year) {
      values.push(`(${motorcycle.year})`);
    }

    return values.join(" ");
  };

  const enrichAppointment = (service) => {
    const customer =
      getCustomerForRecord(service);

    const motorcycle =
      getMotorcycleForRecord(service);

    return {
      ...service,

      customerName:
        service.customerName ||
        service.fullName ||
        customer?.fullName ||
        customer?.name ||
        "Customer",

      customerId:
        service.customerId ||
        service.userId ||
        service.userUid ||
        service.customerUid ||
        customer?.id ||
        "",

      motorcycle:
        service.motorcycleName ||
        (typeof service.motorcycle === "string"
          ? service.motorcycle
          : formatMotorcycle(motorcycle)) ||
        "",

      serviceType:
        service.serviceType ||
        service.serviceName ||
        service.type ||
        "Service",

      preferredDate:
        service.preferredDate ||
        service.date ||
        service.scheduleDate ||
        service.requestDate ||
        "",

      preferredTime:
        service.preferredTime ||
        service.time ||
        service.scheduleTime ||
        "",

      status:
        service.status ||
        "Pending",

      approvalStatus:
        service.approvalStatus ||
        "pending",

      paymentStatus:
        service.paymentStatus ||
        "pending",
    };
  };

  /*
   * ============================================================
   * CUSTOMER CHANGE
   * ============================================================
   */

  const handleCustomerChange = (customerId) => {
    if (customerId === "__others__") {
      setAddCustomerMotorcycles([]);

      setAddForm((form) => ({
        ...form,
        customerId: "__others__",
        customerName: "",
        motorcycleId: "",
        motorcycle: "",
        otherBrand: "",
        otherModel: "",
        otherPlate: "",
        otherYear: "",
      }));

      return;
    }

    const customer =
      allCustomers.find(
        (item) => item.id === customerId
      );

    if (!customer) {
      setAddForm((form) => ({
        ...form,
        customerId: "",
        customerName: "",
        motorcycleId: "",
        motorcycle: "",
      }));

      setAddCustomerMotorcycles([]);

      return;
    }

    const customerMotorcycles =
      motorcycles.filter((motorcycle) => {
        const ownerId =
          getMotorcycleOwnerId(motorcycle);

        if (
          ownerId &&
          ownerId === customer.id
        ) {
          return true;
        }

        if (
          motorcycle.customerEmail &&
          customer.email
        ) {
          return (
            String(
              motorcycle.customerEmail
            ).toLowerCase() ===
            String(customer.email).toLowerCase()
          );
        }

        if (
          motorcycle.userEmail &&
          customer.email
        ) {
          return (
            String(
              motorcycle.userEmail
            ).toLowerCase() ===
            String(customer.email).toLowerCase()
          );
        }

        return false;
      });

    setAddCustomerMotorcycles(
      customerMotorcycles
    );

    setAddForm((form) => ({
      ...form,
      customerId,
      customerName:
        customer.name ||
        customer.fullName ||
        customer.email ||
        "",
      motorcycleId: "",
      motorcycle: "",
      otherBrand: "",
      otherModel: "",
      otherPlate: "",
      otherYear: "",
    }));
  };

  /*
   * ============================================================
   * CREATE MANUAL SCHEDULE
   * ============================================================
   */

  const handleCreateSchedule = async () => {
    const isOtherCustomer =
      addForm.customerId === "__others__";

    const isOtherMoto =
      addForm.motorcycleId === "__others__";

    const resolvedCustomerName =
      isOtherCustomer
        ? addForm.customerName.trim()
        : addForm.customerName;

    const resolvedMoto = isOtherMoto
      ? [
          addForm.otherBrand,
          addForm.otherModel,
          addForm.otherYear
            ? `(${addForm.otherYear})`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : addForm.motorcycle;

    if (
      !addForm.customerId ||
      !resolvedCustomerName ||
      !resolvedMoto ||
      !addForm.serviceType ||
      !addForm.date ||
      !addForm.time ||
      !addForm.assignedStaff
    ) {
      return;
    }

    try {
      const selectedStaff =
        mechanics.find(
          (staffMember) =>
            staffMember.id === addForm.assignedStaffId ||
            staffMember.name === addForm.assignedStaff
        );

      if (!selectedStaff) {
        return;
      }

      const serviceRef = doc(
        collection(db, "services")
      );

      const generatedCustomerId =
        isOtherCustomer
          ? `manual-customer-${serviceRef.id}`
          : addForm.customerId;

      const scheduleRef = doc(
        db,
        "schedules",
        addForm.date
      );

      await runTransaction(
        db,
        async (transaction) => {
          const scheduleSnapshot =
            await transaction.get(
              scheduleRef
            );

          const scheduleData =
            scheduleSnapshot.exists()
              ? scheduleSnapshot.data()
              : {};

          const existingBookedSlots =
            scheduleData.bookedSlots || {};

          const currentCount =
            Number(
              existingBookedSlots[
                addForm.time
              ] || 0
            );

          const newEntry = {
            customerId:
              generatedCustomerId,

            customerName:
              resolvedCustomerName,

            motorcycleId:
              isOtherMoto
                ? ""
                : addForm.motorcycleId,

            motorcycle:
              resolvedMoto,

            plate:
              isOtherMoto
                ? addForm.otherPlate.trim()
                : "",

            serviceType:
              addForm.serviceType,

            preferredDate:
              addForm.date,

            preferredTime:
              addForm.time,

            requestDate:
              todayStr,

            assignedStaff:
              addForm.assignedStaff,

            assignedStaffId:
              selectedStaff?.id || null,

            assignedStaffPosition:
              selectedStaff?.position || null,

            issueDescription:
              addForm.notes,

            approvalStatus:
              "approved",

            paymentStatus:
              "confirmed",

            status:
              "Pending",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          };

          transaction.set(
            serviceRef,
            newEntry
          );

          transaction.set(
            scheduleRef,
            {
              date: addForm.date,

              bookedSlots: {
                ...existingBookedSlots,

                [addForm.time]:
                  currentCount + 1,
              },

              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );
        }
      );

      if (
        addForm.date !== selectedDate
      ) {
        setSelectedDate(
          addForm.date
        );

        setCurrentMonth(
          new Date(
            `${addForm.date}T00:00:00`
          )
        );
      }

      setShowAddModal(false);

      setAddForm({
        customerId: "",
        customerName: "",
        motorcycleId: "",
        motorcycle: "",
        serviceType: "",
        date: todayStr,
        time: "",
        assignedStaff: "",
        assignedStaffId: "",
        notes: "",
        otherBrand: "",
        otherModel: "",
        otherPlate: "",
        otherYear: "",
      });

      setAddCustomerMotorcycles([]);
    } catch (error) {
      console.error(
        "Error creating schedule:",
        error
      );
    }
  };

  /*
   * ============================================================
   * CALENDAR HELPERS
   * ============================================================
   */

  const getDaysInMonth = (date) => {
    const year =
      date.getFullYear();

    const month =
      date.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );

    const daysInMonth =
      lastDay.getDate();

    const startingDayOfWeek =
      firstDay.getDay();

    const days = [];

    for (
      let i = 0;
      i < startingDayOfWeek;
      i++
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      days.push(day);
    }

    return days;
  };

  const formatDate = (day) => {
    const year =
      currentMonth.getFullYear();

    const month =
      String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0");

    const dayStr =
      String(day).padStart(2, "0");

    return `${year}-${month}-${dayStr}`;
  };

  const getDateStatus = (dateStr) => {
    const bookedSlots =
      shopSchedule.bookedSlots[
        dateStr
      ] || {};

    let occupiedSlotCount = 0;

    shopSchedule.timeSlots.forEach(
      (time) => {
        if (
          (bookedSlots[time] || 0) > 0
        ) {
          occupiedSlotCount++;
        }
      }
    );

    const totalSlots =
      shopSchedule.timeSlots.length;

    const isFullyBooked =
      occupiedSlotCount >=
      totalSlots;

    const isPartial =
      occupiedSlotCount > 0 &&
      !isFullyBooked;

    return {
      isFullyBooked,
      isPartial,
      occupiedSlotCount,
      totalSlots,
    };
  };

  const getOccupiedSlots = (dateStr) => {
    const bookedSlots =
      shopSchedule.bookedSlots[
        dateStr
      ] || {};

    return shopSchedule.timeSlots.filter(
      (time) =>
        (bookedSlots[time] || 0) > 0
    ).length;
  };

  const isToday = (day) => {
    const today =
      new Date();

    return (
      day === today.getDate() &&
      currentMonth.getMonth() ===
        today.getMonth() &&
      currentMonth.getFullYear() ===
        today.getFullYear()
    );
  };

  const isHoliday = (dateStr) =>
    holidays.some(
      (holiday) =>
        holiday.date === dateStr
    );

  const isDateBlocked = (dateStr) =>
    Object.keys(
      blockedSchedules[dateStr] || {}
    ).length > 0;

  /*
   * ============================================================
   * APPOINTMENTS
   * ============================================================
   */

  const getAppointmentsForDate = (
    dateStr
  ) => {
    return allServices
      .map(enrichAppointment)
      .filter(
        (service) =>
          service.preferredDate ===
          dateStr &&
          service.status !==
            "Rejected" &&
          String(
            service.approvalStatus || ""
          ).toLowerCase() !==
            "rejected"
      );
  };

  /*
   * ============================================================
   * BLOCK SCHEDULE
   * ============================================================
   */

  const handleBlockSchedule =
    async () => {
      if (
        !selectedDate ||
        !blockForm.timeSlot
      ) {
        return;
      }

      try {
        const scheduleRef =
          doc(
            db,
            "schedules",
            selectedDate
          );

        await runTransaction(
          db,
          async (transaction) => {
            const scheduleSnapshot =
              await transaction.get(
                scheduleRef
              );

            const scheduleData =
              scheduleSnapshot.exists()
                ? scheduleSnapshot.data()
                : {};

            const existingBookedSlots =
              scheduleData.bookedSlots ||
              {};

            const existingBlockedSlots =
              scheduleData.blockedSlots ||
              {};

            transaction.set(
              scheduleRef,
              {
                date: selectedDate,

                bookedSlots: {
                  ...existingBookedSlots,

                  [blockForm.timeSlot]:
                    DAILY_CAPACITY,
                },

                blockedSlots: {
                  ...existingBlockedSlots,

                  [blockForm.timeSlot]: {
                    reason:
                      blockForm.reason.trim() ||
                      "Blocked",
                    blockedAt:
                      new Date().toISOString(),
                  },
                },

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );
          }
        );

        setShowBlockModal(false);

        setBlockForm({
          timeSlot: "",
          reason: "",
        });
      } catch (error) {
        console.error(
          "Error blocking schedule:",
          error
        );
      }
    };

  /*
   * ============================================================
   * DERIVED DATA
   * ============================================================
   */

  const selectedAppointments =
    getAppointmentsForDate(
      selectedDate
    );

  const occupiedToday =
    getOccupiedSlots(
      todayStr
    );

  const occupiedSelected =
    getOccupiedSlots(
      selectedDate
    );

  const totalSlots =
    shopSchedule.timeSlots.length;

  const availableToday =
    totalSlots -
    occupiedToday;

  const blockedHoursToday =
    Object.keys(
      blockedSchedules[
        todayStr
      ] || {}
    ).length;

  const availableMechanics =
    mechanics.filter(
      (mechanic) =>
        mechanic.available
    ).length;

  const capacityPct =
    totalSlots > 0
      ? (occupiedSelected /
          totalSlots) *
        100
      : 0;

  const formatDisplayDate =
    (dateStr) => {
      const date =
        new Date(
          dateStr +
            "T00:00:00"
        );

      return date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );
    };

  const statusLabel = (appt) => {
    if (
      appt.status ===
      "In Progress"
    ) {
      return "In Progress";
    }

    if (
      appt.status ===
      "Completed"
    ) {
      return "Completed";
    }

    if (
      appt.approvalStatus ===
        "approved" &&
      appt.paymentStatus ===
        "confirmed"
    ) {
      return "Confirmed";
    }

    if (
      appt.approvalStatus ===
      "approved"
    ) {
      return "Approved";
    }

    return "Pending";
  };

  const statusBadgeClass =
    (label) => {
      if (
        label === "Confirmed" ||
        label === "In Progress"
      ) {
        return "bg-gray-900 text-white";
      }

      if (
        label === "Approved"
      ) {
        return "bg-gray-700 text-white";
      }

      if (
        label === "Completed"
      ) {
        return "bg-gray-100 text-gray-500";
      }

      return "bg-gray-100 text-gray-600";
    };

  const getApptTime = (appt) =>
    appt.preferredTime ||
    "—";
  return (
    <AdminLayout title="Schedules">

      {/* ── PAGE SUBHEADER + ACTION ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Add Schedule
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
          >
            <Ban size={14} />
            Block Schedule
          </button>
        </div>
      </div>

      {/* ── SCHEDULE OVERVIEW STRIP ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Today's Appts", value: getAppointmentsForDate(todayStr).length, Icon: Calendar },
          { label: 'Available Slots', value: availableToday, Icon: Clock },
          { label: 'Mechanics', value: availableMechanics, Icon: Users },
          { label: 'Blocked Hours', value: blockedHoursToday, Icon: Ban },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">{label}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
              <Icon size={13} className="text-gray-400 mb-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN WORKSPACE: Calendar + Selected Date ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* LEFT: Compact Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <p className="text-sm font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Today shortcut */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDate(todayStr); }}
              className="text-[11px] text-gray-500 hover:text-gray-800 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {getDaysInMonth(currentMonth).map((day, index) => {
              if (day === null) return <div key={`e-${index}`} className="aspect-square" />;

              const dateStr = formatDate(day);
              const status = getDateStatus(dateStr);
              const todayDay = isToday(day);
              const isSelected = selectedDate === dateStr;
              const holidayDay = isHoliday(dateStr);
              const blockedDay = isDateBlocked(dateStr);

              let cellClass = 'bg-white text-gray-700 hover:bg-gray-100';
              if (holidayDay) cellClass = 'bg-purple-50 text-purple-700 hover:bg-purple-100';
              else if (blockedDay) cellClass = 'bg-red-50 text-red-600 hover:bg-red-100';
              else if (status.isFullyBooked) cellClass = 'bg-gray-800 text-white hover:bg-gray-700';
              else if (status.isPartial) cellClass = 'bg-amber-50 text-amber-800 hover:bg-amber-100';

              if (isSelected) cellClass = 'bg-[#0a0f1a] text-white hover:bg-[#1e293b]';

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors relative
                    ${cellClass}
                    ${todayDay && !isSelected ? 'ring-1 ring-[#0a0f1a] ring-inset' : ''}
                  `}
                >
                  {day}
                  {status.isPartial && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { color: 'bg-white border border-gray-200', label: 'Available' },
              { color: 'bg-amber-100', label: 'Partial' },
              { color: 'bg-gray-800', label: 'Full' },
              { color: 'bg-[#0a0f1a]', label: 'Selected' },
              { color: 'bg-red-100', label: 'Blocked' },
              { color: 'bg-purple-100', label: 'Holiday' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Selected Date Schedule */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
              {selectedDate === todayStr ? "Today's Schedule" : 'Selected Date'}
            </p>
            <h3 className="text-base font-semibold text-gray-900 leading-snug">
              {formatDisplayDate(selectedDate)}
            </h3>
          </div>

          {/* Slot capacity */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{occupiedSelected} / {totalSlots} slots occupied</span>
              <span className="text-xs text-gray-400">{Math.round(capacityPct)}% capacity</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  capacityPct >= 100 ? 'bg-gray-800' :
                  capacityPct >= 60 ? 'bg-amber-500' :
                  'bg-[#0a0f1a]'
                }`}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Assigned Mechanics */}
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5 flex items-center gap-1.5">
              <Users size={11} />
              Assigned Mechanics
            </p>

            <div className="space-y-1.5">
              {mechanics.length === 0 ? (
                <div className="py-3 px-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">
                    No staff members registered.
                  </p>
                </div>
              ) : (
                mechanics.map((mechanic) => {
                  /*
                   * Get appointments assigned to this mechanic
                   * for the currently selected date.
                   */
                  const mechanicAppointments =
                    selectedAppointments.filter(
                      (appointment) =>
                        appointment.assignedStaffId === mechanic.id ||
                        appointment.assignedStaff === mechanic.name
                    );

                  /*
                   * Count unique appointment times so one mechanic
                   * slot is counted once per time slot.
                   */
                  const occupiedMechanicTimes = [
                    ...new Set(
                      mechanicAppointments
                        .map(
                          (appointment) =>
                            appointment.preferredTime
                        )
                        .filter(Boolean)
                    ),
                  ];

                  /*
                   * Count blocked time slots for the selected date.
                   */
                  const blockedTimes = Object.keys(
                    blockedSchedules[selectedDate] || {}
                  );

                  /*
                   * Total time slots available to this mechanic
                   * on the selected date.
                   */
                  const totalAvailableTimeSlots =
                    shopSchedule.timeSlots.filter(
                      (time) => !blockedTimes.includes(time)
                    ).length;

                  /*
                   * Remaining appointment slots for this mechanic.
                   */
                  const availableMechanicSlots =
                    mechanic.available
                      ? Math.max(
                          totalAvailableTimeSlots -
                            occupiedMechanicTimes.length,
                          0
                        )
                      : 0;

                  const mechanicStatus =
                    !mechanic.available
                      ? "Unavailable"
                      : availableMechanicSlots === 0
                      ? "Fully Booked"
                      : occupiedMechanicTimes.length > 0
                      ? "Partially Booked"
                      : "Available";

                  return (
                    <div
                      key={mechanic.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            mechanicStatus === "Available"
                              ? "bg-green-500"
                              : mechanicStatus === "Partially Booked"
                              ? "bg-amber-400"
                              : mechanicStatus === "Fully Booked"
                              ? "bg-gray-700"
                              : "bg-gray-300"
                          }`}
                        />

                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">
                            {mechanic.name}
                          </p>

                          <p className="text-[10px] text-gray-400">
                            {mechanicAppointments.length}{" "}
                            {mechanicAppointments.length === 1
                              ? "appointment"
                              : "appointments"}{" "}
                            assigned
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p
                          className={`text-xs font-semibold ${
                            mechanicStatus === "Available"
                              ? "text-green-600"
                              : mechanicStatus === "Partially Booked"
                              ? "text-amber-600"
                              : mechanicStatus === "Fully Booked"
                              ? "text-gray-700"
                              : "text-gray-400"
                          }`}
                        >
                          {availableMechanicSlots}{" "}
                          {availableMechanicSlots === 1
                            ? "slot"
                            : "slots"}{" "}
                          available
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {occupiedMechanicTimes.length}/
                          {totalAvailableTimeSlots} booked
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Blocked time slots for selected date */}
          {blockedSchedules[selectedDate] && Object.keys(blockedSchedules[selectedDate]).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5 flex items-center gap-1.5">
                <Ban size={11} />
                Blocked Slots
              </p>
              <div className="space-y-1.5">
                {Object.entries(blockedSchedules[selectedDate]).map(([time, info]) => (
                  <div key={time} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-sm font-medium text-red-800">{time}</span>
                    <span className="text-xs text-red-500 truncate max-w-32">{info.reason || 'Blocked'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {occupiedSelected === 0 && !blockedSchedules[selectedDate] && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <Calendar size={28} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No bookings for this date</p>
              <p className="text-xs text-gray-300 mt-0.5">All {totalSlots} slots available</p>
            </div>
          )}
        </div>
      </div>

      {/* ── APPOINTMENTS TABLE ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <Wrench size={15} className="text-gray-500" />
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-sm font-semibold text-gray-800">Appointments</h3>
            <span className="text-xs text-gray-400 font-normal">
              — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {selectedAppointments.length > 0 && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {selectedAppointments.length}
            </span>
          )}
        </div>

        {selectedAppointments.length === 0 ? (
          <div className="text-center py-14">
            <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No appointments scheduled</p>
            <p className="text-xs text-gray-400 mt-1">There are no service appointments scheduled for this date.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {['Time', 'Customer', 'Motorcycle', 'Service', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedAppointments.map((appt) => {
                    const label = statusLabel(appt);
                    return (
                      <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-mono text-gray-700">{getApptTime(appt)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{appt.customerName}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-gray-600">{appt.motorcycle}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-gray-700">{appt.serviceType}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusBadgeClass(label)}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile rows */}
            <div className="md:hidden divide-y divide-gray-50">
              {selectedAppointments.map((appt) => {
                const label = statusLabel(appt);
                return (
                  <div key={appt.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{appt.customerName}</p>
                        <p className="text-xs text-gray-500">{appt.motorcycle}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadgeClass(label)}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="font-mono">{getApptTime(appt)}</span>
                      <span>·</span>
                      <span>{appt.serviceType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── ADD SCHEDULE MODAL ───────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Add Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manually create a service appointment</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              {/* Customer */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Customer *</label>
                <select
                  value={addForm.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white"
                >
                  <option value="">Select customer</option>
                  {allCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="__others__">+ Others</option>
                </select>
                {addForm.customerId === '__others__' && (
                  <input
                    type="text"
                    value={addForm.customerName}
                    onChange={(e) => setAddForm(f => ({ ...f, customerName: e.target.value }))}
                    className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                    placeholder="Enter customer name"
                  />
                )}
              </div>

              {/* Motorcycle */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Motorcycle *</label>
                <select
                  value={addForm.motorcycleId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__others__') {
                      setAddForm(f => ({ ...f, motorcycleId: '__others__', motorcycle: '', otherBrand: '', otherModel: '', otherPlate: '', otherYear: '' }));
                      return;
                    }
                    const moto = addCustomerMotorcycles.find((m) => m.id === val);
                    setAddForm(f => ({
                      ...f,
                      motorcycleId: val,
                      motorcycle: moto ? `${moto.brand} ${moto.model} (${moto.year})` : '',
                      otherBrand: '', otherModel: '', otherPlate: '', otherYear: ''
                    }));
                  }}
                  disabled={!addForm.customerId}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {addForm.customerId ? (addCustomerMotorcycles.length === 0 && addForm.customerId !== '__others__' ? 'No motorcycles registered' : 'Select motorcycle') : 'Select customer first'}
                  </option>
                  {addCustomerMotorcycles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} ({m.year}){m.plate ? ` — ${m.plate}` : ''}
                    </option>
                  ))}
                  {addForm.customerId && <option value="__others__">+ Others</option>}
                </select>
                {addForm.motorcycleId === '__others__' && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={addForm.otherBrand}
                      onChange={(e) => setAddForm(f => ({ ...f, otherBrand: e.target.value }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="Brand"
                    />
                    <input
                      type="text"
                      value={addForm.otherModel}
                      onChange={(e) => setAddForm(f => ({ ...f, otherModel: e.target.value }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="Model"
                    />
                    <input
                      type="text"
                      value={addForm.otherPlate}
                      onChange={(e) => setAddForm(f => ({ ...f, otherPlate: e.target.value }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="Plate Number"
                    />
                    <input
                      type="text"
                      value={addForm.otherYear}
                      onChange={(e) => setAddForm(f => ({ ...f, otherYear: e.target.value }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="Year Model"
                    />
                  </div>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Type *</label>
                <select
                  value={addForm.serviceType}
                  onChange={(e) => setAddForm(f => ({ ...f, serviceType: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white"
                >
                  <option value="">Select service type</option>
                  {['Oil Change', 'Tire Replacement', 'Brake Service', 'PMS', 'Engine Repair', 'Electrical', 'Suspension', 'Chain & Sprocket', 'Air Filter', 'Carburetor Cleaning', 'Other'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        date: e.target.value,
                        assignedStaff: "",
                        assignedStaffId: "",
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time *</label>
                  <select
                    value={addForm.time}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        time: e.target.value,
                        assignedStaff: "",
                        assignedStaffId: "",
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white"
                  >
                    <option value="">Select time</option>
                    {shopSchedule.timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assigned Staff</label>
                <select
                  value={addForm.assignedStaff}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const selectedStaff = availableMechanicsForAdd.find(
                      (m) => m.name === selectedName
                    );

                    setAddForm((f) => ({
                      ...f,
                      assignedStaff: selectedName,
                      assignedStaffId: selectedStaff?.id || "",
                    }));
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white"
                >
                  <option value="">
                    {addForm.time
                      ? "Select available staff"
                      : "Select time first"}
                  </option>

                  {availableMechanicsForAdd.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} — Available
                    </option>
                  ))}
                </select>

                {addForm.time &&
                  availableMechanicsForAdd.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      No staff available for {addForm.time} on {addForm.date}.
                    </p>
                  )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateSchedule}
                disabled={
                  !addForm.customerId ||
                  (addForm.customerId === '__others__' && !addForm.customerName.trim()) ||
                  !addForm.motorcycleId ||
                  (addForm.motorcycleId === '__others__' ? !addForm.otherBrand.trim() : !addForm.motorcycle) ||
                  !addForm.serviceType || !addForm.date || !addForm.time || !addForm.assignedStaff
                }
                className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Schedule
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK SCHEDULE MODAL ─────────────────────────────────────── */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Block Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date on the calendar first'}
                </p>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time Slot *</label>
                <select
                  value={blockForm.timeSlot}
                  onChange={(e) => setBlockForm({ ...blockForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white"
                >
                  <option value="">Select time slot</option>
                  {shopSchedule.timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason</label>
                <select
                  onChange={(e) => { if (e.target.value) setBlockForm({ ...blockForm, reason: e.target.value }); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm bg-white mb-2"
                >
                  <option value="">Quick select…</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Staff unavailable">Staff unavailable</option>
                  <option value="Shop closed">Shop closed</option>
                </select>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  placeholder="Or type a custom reason..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBlockSchedule}
                className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
              >
                Block Time Slot
              </button>
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
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

export default AdminSchedule;
