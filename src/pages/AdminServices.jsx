import { useState } from 'react';
import AdminLayout from "./AdminLayout";
import { Clock, CheckCircle, X, Check, Printer, MessageSquare, Play } from 'lucide-react';
import { mockServiceRequests, mockActiveServices, mockShopSchedule } from "./mockData";
import { useNavigate } from "react-router-dom";

function AdminServices() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [serviceRequests, setServiceRequests] = useState(() => {
    const saved = localStorage.getItem('umes_service_requests');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('umes_service_requests', JSON.stringify(mockServiceRequests));
    return mockServiceRequests;
  });
  const [activeServices, setActiveServices] = useState(() => {
    const saved = localStorage.getItem('umes_active_services');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('umes_active_services', JSON.stringify(mockActiveServices));
    return mockActiveServices;
  });

  const [shopSchedule, setShopSchedule] = useState(() => {
    const saved = localStorage.getItem('umes_shop_schedule');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('umes_shop_schedule', JSON.stringify(mockShopSchedule));
    return mockShopSchedule;
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalData, setApprovalData] = useState({
    assignedStaff: '',
    estimatedCost: '',
    estimatedTime: ''
  });

  const [mechanics] = useState(() => {
    const saved = localStorage.getItem('umes_mechanics');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'mech-1', name: 'Juan Dela Cruz', maxAppointments: 5, available: true },
      { id: 'mech-2', name: 'Maria Santos', maxAppointments: 5, available: true },
      { id: 'mech-3', name: 'Pedro Garcia', maxAppointments: 4, available: true }
    ];
  });

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleSaveRejection = () => {
    if (selectedRequest) {
      const updatedRequests = serviceRequests.filter(r => r.id !== selectedRequest.id);
      setServiceRequests(updatedRequests);
      localStorage.setItem('umes_service_requests', JSON.stringify(updatedRequests));
    }
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleConfirmPayment = (request) => {
    // Update request to confirmed payment status
    const updatedRequests = serviceRequests.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          paymentStatus: 'confirmed'
        };
      }
      return r;
    });

    setServiceRequests(updatedRequests);
    localStorage.setItem('umes_service_requests', JSON.stringify(updatedRequests));

    // Update shop schedule - mark the time slot as occupied
    const date = request.preferredDate;
    const time = request.preferredTime;

    const updatedSchedule = { ...shopSchedule };
    if (!updatedSchedule.bookedSlots[date]) {
      updatedSchedule.bookedSlots[date] = {};
    }
    updatedSchedule.bookedSlots[date][time] = (updatedSchedule.bookedSlots[date][time] || 0) + 1;

    setShopSchedule(updatedSchedule);
    localStorage.setItem('umes_shop_schedule', JSON.stringify(updatedSchedule));
  };

  const handleActivateService = (request) => {
    // Move from request to active service
    const newActiveService = {
      id: `srv-${Date.now()}`,
      customerId: request.customerId,
      customerName: request.customerName,
      motorcycleId: request.motorcycleId,
      motorcycle: request.motorcycle,
      serviceType: request.serviceType,
      status: 'In Progress',
      requestDate: request.requestDate,
      assignedStaff: request.assignedStaff || 'Unassigned',
      estimatedCost: Number(request.estimatedCost) || 0,
      estimatedTime: request.estimatedTime || 'TBD',
      notes: request.issueDescription,
      paymentMethod: request.paymentMethod,
      paymentStatus: request.paymentStatus
    };

    // Add to active services
    const updatedActiveServices = [...activeServices, newActiveService];
    setActiveServices(updatedActiveServices);
    localStorage.setItem('umes_active_services', JSON.stringify(updatedActiveServices));

    // Remove from requests
    const updatedRequests = serviceRequests.filter(r => r.id !== request.id);
    setServiceRequests(updatedRequests);
    localStorage.setItem('umes_service_requests', JSON.stringify(updatedRequests));

    // Show success
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleSaveApproval = () => {
    if (selectedRequest) {
      // Update request with approval status and assignment details
      const updatedRequests = serviceRequests.map(r => {
        if (r.id === selectedRequest.id) {
          return {
            ...r,
            approvalStatus: 'approved',
            assignedStaff: approvalData.assignedStaff,
            estimatedCost: Number(approvalData.estimatedCost) || 0,
            estimatedTime: approvalData.estimatedTime
          };
        }
        return r;
      });

      setServiceRequests(updatedRequests);
      localStorage.setItem('umes_service_requests', JSON.stringify(updatedRequests));

      // Show success message
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
    setShowApprovalModal(false);
    setApprovalData({ assignedStaff: '', estimatedCost: '', estimatedTime: '' });
  };

  const handlePrintDetails = (service) => {
    setSelectedService(service);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
    setShowPrintModal(false);
  };

  const handleSendMessage = (service) => {
    setSelectedService(service);
    setShowMessageModal(true);
  };

  const handleMessageSend = () => {
    setShowMessageModal(false);
    navigate('/admin/messages');
  };

  const handleStatusUpdate = (service) => {
    setSelectedService(service);
    setShowStatusModal(true);
  };

  const handleSaveStatus = (newStatus) => {
    if (!selectedService) return;

    // Special handling for "Completed" status
    if (newStatus === 'Completed') {
      // Remove from active services
      const updatedActiveServices = activeServices.filter(s => s.id !== selectedService.id);
      setActiveServices(updatedActiveServices);
      localStorage.setItem('umes_active_services', JSON.stringify(updatedActiveServices));

      // Add to completed services
      const completedService = {
        id: selectedService.id,
        customerId: selectedService.customerId,
        customerName: selectedService.customerName,
        motorcycleId: selectedService.motorcycleId,
        motorcycle: selectedService.motorcycle,
        serviceType: selectedService.serviceType,
        completedDate: new Date().toISOString().split('T')[0],
        cost: selectedService.estimatedCost,
        partsUsed: ['Various Parts'],
        assignedStaff: selectedService.assignedStaff,
        rating: 0,
        feedback: ''
      };

      const existingCompleted = JSON.parse(localStorage.getItem('umes_completed_services') || '[]');
      const updatedCompleted = [...existingCompleted, completedService];
      localStorage.setItem('umes_completed_services', JSON.stringify(updatedCompleted));

      // Show completion notification
      setShowStatusModal(false);
      setShowCompletionModal(true);
      setTimeout(() => {
        setShowCompletionModal(false);
        setSelectedService(null);
      }, 3000);
      return;
    }

    // Regular status update for other statuses
    const updatedServices = activeServices.map(s => {
      if (s.id === selectedService.id) {
        return { ...s, status: newStatus };
      }
      return s;
    });

    setActiveServices(updatedServices);
    localStorage.setItem('umes_active_services', JSON.stringify(updatedServices));
    setShowStatusModal(false);
    setSelectedService(null);
  };

  return (
    <AdminLayout title="Services">
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'requests'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Service Requests ({serviceRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'active'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Services ({activeServices.length})
          </button>
        </div>
      </div>

      {/* Service Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {serviceRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No pending service requests
            </div>
          ) : (
            serviceRequests.map(request => {
              const isApproved = request.approvalStatus === 'approved';
              const hasPayment = request.paymentMethod;
              const paymentVerified = request.paymentStatus === 'confirmed';

              return (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">REQUEST ID</span>
                        <span className="text-sm font-mono bg-black text-white px-3 py-1 rounded">{request.id}</span>
                      </div>
                      <h3 className="text-xl font-medium">{request.customerName}</h3>
                      <p className="text-sm text-gray-600">{request.motorcycle}</p>
                    </div>
                    <div className="flex gap-2 flex-col items-end">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        isApproved ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {isApproved ? '✓ Service Approved' : 'Service Pending'}
                      </span>
                      {hasPayment && (
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          paymentVerified ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                        }`}>
                          {paymentVerified ? '✓ Payment Verified' : 'Payment Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-medium mb-4">Service Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service Type</p>
                        <p className="text-sm font-medium">{request.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Preferred Schedule</p>
                        <p className="text-sm font-medium">{request.preferredDate} at {request.preferredTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Request Date</p>
                        <p className="text-sm font-medium">{request.requestDate}</p>
                      </div>
                    </div>
                    {request.issueDescription && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Issue Description</p>
                        <p className="text-sm text-gray-700">{request.issueDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment & Cost */}
                {isApproved && (
                  <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                      <h4 className="font-medium text-green-900 mb-4">Assignment Details</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-green-700 mb-1">Assigned Staff</p>
                          <p className="text-sm font-medium text-green-900">{request.assignedStaff || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 mb-1">Estimated Cost</p>
                          <p className="text-sm font-medium text-green-900">
                            {request.estimatedCost ? `₱${(request.estimatedCost * 50).toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 mb-1">Estimated Time</p>
                          <p className="text-sm font-medium text-green-900">{request.estimatedTime || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="mb-6">
                  <div className={`border rounded-lg p-5 ${
                    paymentVerified ? 'bg-green-50 border-green-200' :
                    hasPayment ? 'bg-gray-50 border-gray-200' :
                    'bg-white border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-4 ${
                      paymentVerified ? 'text-green-900' :
                      hasPayment ? 'text-gray-900' :
                      'text-gray-900'
                    }`}>
                      Payment Information
                    </h4>
                    {!hasPayment ? (
                      <p className="text-sm text-gray-600">
                        No payment submitted. Customer will be notified after service approval.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className={`text-xs mb-1 ${paymentVerified ? 'text-green-700' : hasPayment ? 'text-gray-700' : 'text-gray-500'}`}>
                            Payment Method
                          </p>
                          <p className={`text-sm font-medium ${paymentVerified ? 'text-green-900' : hasPayment ? 'text-gray-900' : 'text-gray-900'}`}>
                            {request.paymentMethod === 'gcash' ? 'GCash' :
                             request.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${paymentVerified ? 'text-green-700' : hasPayment ? 'text-gray-700' : 'text-gray-500'}`}>
                            Amount
                          </p>
                          <p className={`text-sm font-medium ${paymentVerified ? 'text-green-900' : hasPayment ? 'text-gray-900' : 'text-gray-900'}`}>
                            {request.estimatedCost ? `₱${(request.estimatedCost * 50).toLocaleString()}` : 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${paymentVerified ? 'text-green-700' : hasPayment ? 'text-gray-700' : 'text-gray-500'}`}>
                            Payment Date
                          </p>
                          <p className={`text-sm font-medium ${paymentVerified ? 'text-green-900' : hasPayment ? 'text-gray-900' : 'text-gray-900'}`}>
                            {request.paymentDate || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${paymentVerified ? 'text-green-700' : hasPayment ? 'text-gray-700' : 'text-gray-500'}`}>
                            Status
                          </p>
                          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                            paymentVerified ? 'bg-green-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {paymentVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {!isApproved && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApprove(request)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                      >
                        <Check size={20} />
                        Approve Service & Notify Customer
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        <X size={20} />
                        Reject Request
                      </button>
                      <div className="pt-2">
                        <label className="block text-xs text-gray-500 mb-2">Add Notes (Optional)</label>
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          rows={2}
                          placeholder="Add reason or notes..."
                        />
                      </div>
                    </div>
                  )}

                  {isApproved && !hasPayment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Waiting for customer payment.</strong> Customer has been notified to complete payment.
                      </p>
                    </div>
                  )}

                  {isApproved && hasPayment && !paymentVerified && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-900">
                          <strong>Payment submitted.</strong> Verify payment to proceed. This will update the shop calendar.
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfirmPayment(request)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                      >
                        <CheckCircle size={20} />
                        Confirm Payment & Update Calendar
                      </button>
                    </div>
                  )}

                  {isApproved && paymentVerified && (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-900">
                          <strong>Ready to activate.</strong> Service approved and payment verified.
                        </p>
                      </div>
                      <button
                        onClick={() => handleActivateService(request)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                      >
                        <Play size={20} />
                        Activate Service
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      )}

      {/* Active Services Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeServices.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No active services
            </div>
          ) : (
            activeServices.map(service => (
              <div key={service.id} className="bg-white rounded-lg shadow p-6">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">REF:</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{service.id}</span>
                </div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{service.customerName}</h3>
                  <p className="text-sm text-gray-600">{service.motorcycle}</p>
                </div>
                <span className="bg-gray-100 text-black px-3 py-1 rounded text-sm">
                  {service.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Service Type</p>
                  <p className="text-sm font-medium">{service.serviceType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Assigned Staff</p>
                  <p className="text-sm font-medium">{service.assignedStaff}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estimated Cost</p>
                  <p className="text-sm font-medium">₱{service.estimatedCost * 50}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estimated Time</p>
                  <p className="text-sm font-medium">{service.estimatedTime}</p>
                </div>
              </div>

              {/* Payment Information */}
              {service.paymentMethod && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Payment Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Payment Method</p>
                      <p className="text-sm font-medium capitalize">
                        {service.paymentMethod === 'gcash' ? 'GCash' :
                         service.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payment Status</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        service.paymentStatus === 'pending' ? 'bg-gray-200 text-gray-700' :
                        service.paymentStatus === 'awaiting_confirmation' ? 'bg-gray-300 text-gray-800' :
                        'bg-black text-white'
                      }`}>
                        {service.paymentStatus === 'pending' ? 'Pending (Cash)' :
                         service.paymentStatus === 'awaiting_confirmation' ? 'Awaiting Confirmation' :
                         'Confirmed'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {service.notes && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{service.notes}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2">Current Status</label>
                <button
                  onClick={() => handleStatusUpdate(service)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-left flex items-center justify-between"
                >
                  <span className="text-sm">{service.status}</span>
                  <span className="text-gray-400 text-xs">Click to update</span>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePrintDetails(service)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <Printer size={18} />
                  Print Details
                </button>
                <button
                  onClick={() => handleSendMessage(service)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  <MessageSquare size={18} />
                  Send Message
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg mb-2">Approve Service Request</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-500">REF:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedRequest.id}</span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1">Assigned Staff *</label>
                <select
                  value={approvalData.assignedStaff}
                  onChange={(e) => setApprovalData({ ...approvalData, assignedStaff: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
                >
                  <option value="">Select staff member</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} — {m.available ? 'Available' : 'Unavailable'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Estimated Cost (₱) *</label>
                <input
                  type="number"
                  value={approvalData.estimatedCost}
                  onChange={(e) => setApprovalData({ ...approvalData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter estimated cost"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Estimated Time *</label>
                <input
                  type="text"
                  value={approvalData.estimatedTime}
                  onChange={(e) => setApprovalData({ ...approvalData, estimatedTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., 2 hours"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveApproval}
                className="flex-1 bg-white text-black border border-gray-300 py-2 rounded-md hover:bg-gray-100"
              >
                Save & Approve
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg mb-2">Reject Service Request</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-500">REF:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedRequest.id}</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-1">Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 h-24"
                placeholder="Enter reason for rejecting this service request..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveRejection}
                className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800"
              >
                Reject Request
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg mb-2 font-bold">Service Details</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-500">REF:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedService.id}</span>
            </div>

            <div className="space-y-3 mb-6 border p-4 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="font-medium">{selectedService.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Motorcycle</p>
                  <p className="font-medium">{selectedService.motorcycle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Service Type</p>
                  <p className="font-medium">{selectedService.serviceType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Assigned Staff</p>
                  <p className="font-medium">{selectedService.assignedStaff}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estimated Cost</p>
                  <p className="font-medium">₱{selectedService.estimatedCost * 50}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="font-medium">{selectedService.status}</p>
                </div>
              </div>
              {selectedService.notes && (
                <div>
                  <p className="text-xs text-gray-600">Notes</p>
                  <p className="font-medium">{selectedService.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
              >
                Print
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg mb-2">Send Message</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-500">REF:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedService.id}</span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">To: {selectedService.customerName}</p>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 h-24"
                placeholder="Type your message here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMessageSend}
                className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800"
              >
                Send Message
              </button>
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg mb-2">Update Service Status</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-500">REF:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedService.id}</span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Current status: <span className="font-medium text-black">{selectedService.status}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">Select new status:</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleSaveStatus('In Progress')}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition ${
                    selectedService.status === 'In Progress'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">In Progress</div>
                  <div className="text-xs text-gray-600">Service is currently being worked on</div>
                </button>

                <button
                  onClick={() => handleSaveStatus('Waiting for Parts')}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition ${
                    selectedService.status === 'Waiting for Parts'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Waiting for Parts</div>
                  <div className="text-xs text-gray-600">Service paused, awaiting parts delivery</div>
                </button>

                <button
                  onClick={() => handleSaveStatus('Quality Check')}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition ${
                    selectedService.status === 'Quality Check'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Quality Check</div>
                  <div className="text-xs text-gray-600">Service complete, undergoing final inspection</div>
                </button>

                <button
                  onClick={() => handleSaveStatus('Completed')}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition ${
                    selectedService.status === 'Completed'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Completed</div>
                  <div className="text-xs text-gray-600">Service finished and ready for pickup</div>
                  <div className="text-xs text-black font-medium mt-1">
                    → Auto: Notify customer, send PDF, request feedback
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Completion Success Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-white" size={32} />
              </div>

              <h3 className="text-xl font-medium mb-4">Service Completed!</h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-3">Automated actions triggered:</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">Customer notified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">PDF report generated & sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">Feedback request triggered</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Service moved to completed services.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert Modal */}
      {showSuccessAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <CheckCircle size={24} className="text-white" />
                <h3 className="text-lg font-semibold">Service Approved</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="text-gray-700 mb-6 space-y-3">
                <p><strong>✓ Service Request Approved!</strong></p>
                <p>Customer has been notified to complete payment. Service will move to Active once payment is verified.</p>
              </div>
              <button
                onClick={() => setShowSuccessAlert(false)}
                className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminServices;
