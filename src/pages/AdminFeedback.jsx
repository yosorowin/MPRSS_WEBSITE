import { useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  Star,
  Trash2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  X,
} from "lucide-react";
import {
  mockFeedback,
  mockCommunityBuilds,
} from "./mockData";

export default function AdminFeedback() {
  const [activeTab, setActiveTab] = useState("service");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);

  const [serviceFeedback, setServiceFeedback] = useState(() => {
    const saved = localStorage.getItem("mprss_feedback");

    if (saved) {
      return JSON.parse(saved);
    }

    return mockFeedback;
  });

  const [communityBuilds, setCommunityBuilds] = useState(() => {
    const saved = localStorage.getItem("mprss_community_builds");

    if (saved) {
      return JSON.parse(saved);
    }

    return mockCommunityBuilds;
  });

  const allComments = communityBuilds.flatMap((build) =>
    build.comments.map((comment) => ({
      ...comment,
      buildId: build.id,
      buildName: `${build.motorcycleBrand} ${build.motorcycleModel}`,
      buildGoal: build.buildGoal,
    }))
  );

  const avgRating =
    serviceFeedback.length > 0
      ? (
          serviceFeedback.reduce(
            (sum, feedback) => sum + feedback.rating,
            0
          ) / serviceFeedback.length
        ).toFixed(1)
      : "0.0";

  const totalComments = allComments.length;
  const totalSharedBuilds = communityBuilds.length;

  const handleDeleteComment = (comment) => {
    setItemToDelete(comment);
    setDeleteType("comment");
    setShowDeleteModal(true);
  };

  const handleDeleteBuild = (build) => {
    setItemToDelete(build);
    setDeleteType("build");
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteType === "comment" && itemToDelete) {
      const updatedBuilds = communityBuilds.map((build) => {
        if (build.id === itemToDelete.buildId) {
          return {
            ...build,
            comments: build.comments.filter(
              (comment) => comment.id !== itemToDelete.id
            ),
          };
        }

        return build;
      });

      setCommunityBuilds(updatedBuilds);

      localStorage.setItem(
        "mprss_community_builds",
        JSON.stringify(updatedBuilds)
      );
    }

    if (deleteType === "build" && itemToDelete) {
      const updatedBuilds = communityBuilds.filter(
        (build) => build.id !== itemToDelete.id
      );

      setCommunityBuilds(updatedBuilds);

      localStorage.setItem(
        "mprss_community_builds",
        JSON.stringify(updatedBuilds)
      );
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType(null);
  };

  const tabs = ["service", "comments", "builds"];

  const labels = {
    service: "Service Feedback",
    comments: "Build Comments",
    builds: "Shared Builds",
  };

  const counts = {
    service: serviceFeedback.length,
    comments: totalComments,
    builds: totalSharedBuilds,
  };

  return (
    <AdminLayout title="Feedback & Community">
      {/* OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Average Rating */}
        <div className="lg:col-span-2 bg-[#0a0f1a] text-white rounded-xl p-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-3 font-semibold">
              Average Service Rating
            </p>

            <div className="flex items-end gap-3 mb-1">
              <p className="text-5xl font-bold leading-none">
                {avgRating}
              </p>

              <div className="flex gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={
                      i <= Math.round(Number(avgRating))
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      i <= Math.round(Number(avgRating))
                        ? "text-amber-400"
                        : "text-white/20"
                    }
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-400">
              From {serviceFeedback.length} service reviews
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Star
              size={20}
              className="text-amber-400"
              fill="currentColor"
            />
          </div>
        </div>

        {/* Community Metrics */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Build Comments
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalComments}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={14} className="text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Shared Builds
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalSharedBuilds}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <ThumbsUp size={14} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {labels[tab]}

            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* SERVICE FEEDBACK */}
      {activeTab === "service" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {serviceFeedback.length === 0 ? (
            <div className="text-center py-12">
              <Star
                size={28}
                className="text-gray-200 mx-auto mb-2"
              />

              <p className="text-sm text-gray-400">
                No service feedback yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {serviceFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="px-5 py-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {feedback.customerName}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {feedback.serviceType}
                      </p>
                    </div>

                    <div className="flex gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={
                            i < feedback.rating
                              ? "currentColor"
                              : "none"
                          }
                          className="text-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2.5 rounded-lg leading-relaxed">
                    "{feedback.comment}"
                  </p>

                  <p className="text-[11px] text-gray-400 mt-2">
                    Submitted: {feedback.date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BUILD COMMENTS */}
      {activeTab === "comments" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {allComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare
                size={28}
                className="text-gray-200 mx-auto mb-2"
              />

              <p className="text-sm text-gray-400">
                No community comments yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allComments.map((comment) => (
                <div
                  key={comment.id}
                  className="px-5 py-4"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.userName}
                        </p>

                        <span className="text-[11px] text-gray-400">
                          {comment.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate">
                        On:{" "}
                        <span className="font-medium text-gray-700">
                          {comment.buildName}
                        </span>{" "}
                        · {comment.buildGoal}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteComment(comment)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition text-xs font-medium shrink-0"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2.5 rounded-lg leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHARED BUILDS */}
      {activeTab === "builds" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {communityBuilds.length === 0 ? (
            <div className="text-center py-12">
              <ThumbsUp
                size={28}
                className="text-gray-200 mx-auto mb-2"
              />

              <p className="text-sm text-gray-400">
                No shared builds yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {communityBuilds.map((build) => (
                <div
                  key={build.id}
                  className="px-5 py-4"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">
                          {build.motorcycleBrand}{" "}
                          {build.motorcycleModel}
                        </p>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            build.buildGoal === "Performance"
                              ? "bg-red-100 text-red-700"
                              : build.buildGoal === "Safety"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {build.buildGoal}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500">
                        by {build.userName} · {build.dateShared}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setSelectedBuild(build)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-xs font-medium"
                      >
                        <Eye size={12} />
                        View
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteBuild(build)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition text-xs font-medium"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {build.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      <span>{build.upvotes}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ThumbsDown size={12} />
                      <span>{build.downvotes}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      <span>
                        {build.comments.length} comments
                      </span>
                    </div>

                    <span>
                      ₱{build.estimatedCost.toLocaleString()}
                    </span>

                    <span>
                      {build.compatibilityScore}% compatible
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Confirm Removal
            </h3>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {deleteType === "comment"
                ? `Remove this comment by ${itemToDelete?.userName}? This cannot be undone.`
                : `Remove the shared build "${itemToDelete?.motorcycleBrand} ${itemToDelete?.motorcycleModel}"? All associated comments will also be deleted.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Remove
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUILD DETAILS MODAL */}
      {selectedBuild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedBuild.motorcycleBrand}{" "}
                  {selectedBuild.motorcycleModel}
                </h3>

                <p className="text-sm text-gray-500">
                  by {selectedBuild.userName}
                </p>
              </div>

              <button
                onClick={() => setSelectedBuild(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Description
                </p>

                <p className="text-gray-900">
                  {selectedBuild.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Build Goal
                  </p>
                  <p className="text-gray-900">
                    {selectedBuild.buildGoal}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Difficulty
                  </p>
                  <p className="text-gray-900">
                    {selectedBuild.difficultyLevel}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Estimated Cost
                  </p>
                  <p className="text-gray-900">
                    ₱{selectedBuild.estimatedCost.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Compatibility
                  </p>
                  <p className="text-gray-900">
                    {selectedBuild.compatibilityScore}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Parts ({selectedBuild.parts.length})
                </p>

                <div className="space-y-2">
                  {selectedBuild.parts.map((part, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-lg"
                    >
                      <p className="font-medium text-sm">
                        {part.name}
                      </p>

                      <p className="text-xs text-gray-600">
                        {part.category}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Safety Notes
                </p>

                <p className="text-sm text-amber-800">
                  {selectedBuild.safetyNotes}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedBuild(null)}
              className="w-full mt-6 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}