import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { ArtPost, ArtComment } from "../types";
import {
  Edit2,
  Heart,
  MessageCircle,
  MoreVertical,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Users,
  Hash,
  Trash2,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "news", label: "آخر الأخبار" },
  { id: "activities", label: "النشاطات" },
  { id: "courses", label: "الدورات" },
  { id: "participations", label: "المشاركات الفنية" },
  { id: "annual_reports", label: "التقرير السنوي" },
];

interface ArtsPlatformProps {
  isAdmin: boolean;
}

const ArtsPlatform: React.FC<ArtsPlatformProps> = ({ isAdmin }) => {
  const {
    artPosts,
    toggleLikeArtPost,
    addArtComment,
    deleteArtPost,
    deleteArtComment,
    editArtComment,
    getUserById,
    addArtPost,
  } = useData();
  const { currentUser } = useAuth();

  const hasFullAdminPrivileges =
    isAdmin || currentUser?.fullName === "حسين كاضم";

  const [activeTab, setActiveTab] = useState("all");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});
  const [expandedLikes, setExpandedLikes] = useState<Record<string, boolean>>(
    {},
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState<string>("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewerContext, setViewerContext] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
  } | null>(null);
  const [newPost, setNewPost] = useState<Partial<ArtPost>>({
    title: "",
    description: "",
    category: "news",
    images: [],
    tags: [],
    participantCount: 0,
    organizer: "",
  });

  const openImageViewer = (images: string[], index: number, title: string) => {
    setViewerContext({ images, currentIndex: index, title });
  };

  const closeImageViewer = () => setViewerContext(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerContext) {
      setViewerContext({
        ...viewerContext,
        currentIndex:
          (viewerContext.currentIndex + 1) % viewerContext.images.length,
      });
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerContext) {
      setViewerContext({
        ...viewerContext,
        currentIndex:
          (viewerContext.currentIndex - 1 + viewerContext.images.length) %
          viewerContext.images.length,
      });
    }
  };

  const renderImageGrid = (images: string[] | undefined, title: string) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div
          className="w-full h-64 md:h-96 relative bg-gray-100 dark:bg-gray-900 cursor-pointer group rounded-t-3xl overflow-hidden"
          onClick={() => openImageViewer(images, 0, title)}
        >
          <img
            src={images[0]}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="1"
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="w-full h-64 md:h-96 grid grid-cols-2 gap-1 bg-white dark:bg-gray-800 overflow-hidden relative rounded-t-3xl">
          <img
            onClick={() => openImageViewer(images, 0, title)}
            src={images[0]}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
            alt="1"
          />
          <img
            onClick={() => openImageViewer(images, 1, title)}
            src={images[1]}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
            alt="2"
          />
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="w-full h-64 md:h-96 grid grid-cols-2 grid-rows-2 gap-1 bg-white dark:bg-gray-800 overflow-hidden relative rounded-t-3xl">
          <img
            onClick={() => openImageViewer(images, 0, title)}
            src={images[0]}
            className="w-full h-full object-cover row-span-2 cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
            alt="1"
          />
          <img
            onClick={() => openImageViewer(images, 1, title)}
            src={images[1]}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
            alt="2"
          />
          <img
            onClick={() => openImageViewer(images, 2, title)}
            src={images[2]}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
            alt="3"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-64 md:h-96 grid grid-cols-2 grid-rows-2 gap-1 bg-white dark:bg-gray-800 overflow-hidden relative rounded-t-3xl">
        <img
          onClick={() => openImageViewer(images, 0, title)}
          src={images[0]}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
          alt="1"
        />
        <img
          onClick={() => openImageViewer(images, 1, title)}
          src={images[1]}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
          alt="2"
        />
        <img
          onClick={() => openImageViewer(images, 2, title)}
          src={images[2]}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-900"
          alt="3"
        />
        <div
          className="relative w-full h-full cursor-pointer group"
          onClick={() => openImageViewer(images, 3, title)}
        >
          <img
            src={images[3]}
            className="w-full h-full object-cover bg-gray-100 dark:bg-gray-900 group-hover:opacity-90 transition-opacity"
            alt="4"
          />
          {images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all group-hover:bg-black/70">
              <span className="text-white text-3xl font-black">
                +{images.length - 4}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return artPosts;
    return artPosts.filter((p) => p.category === activeTab);
  }, [artPosts, activeTab]);

  const handleLike = (postId: string, currentLikes: string[]) => {
    if (currentUser) toggleLikeArtPost(postId, currentUser.id, currentLikes);
  };

  const handleComment = (postId: string, comments: any[]) => {
    const text = commentTexts[postId]?.trim();
    if (text && currentUser) {
      addArtComment(postId, currentUser.id, text, comments);
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPost((prev) => ({
            ...prev,
            images: [...(prev.images || []), event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.description) return;
    await addArtPost({
      title: newPost.title,
      description: newPost.description,
      details: newPost.details || "",
      organizer: newPost.organizer || "",
      date: newPost.date || new Date().toISOString(),
      images: newPost.images || [],
      collaborators: newPost.collaborators || "",
      participantCount: newPost.participantCount || 0,
      category: newPost.category as any,
      tags: newPost.tags || [],
    });
    setIsCreateModalOpen(false);
    setNewPost({
      title: "",
      description: "",
      category: "news",
      images: [],
      tags: [],
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/10 dark:bg-brand-dark/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            منصة الفنون
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            نظام التوثيق والإعلام لنشاطات شعبة الفنون والمسرح
          </p>
        </div>
        {hasFullAdminPrivileges && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="relative z-10 flex items-center gap-2 bg-brand-dark dark:bg-brand-light text-white dark:text-brand-dark px-5 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
          >
            <ImageIcon className="w-5 h-5" />
            نشر جديد
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 py-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === cat.id
                ? "bg-brand-dark dark:bg-brand-light text-white dark:text-brand-dark shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 border border-gray-100 dark:border-gray-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">
              لا توجد منشورات
            </h3>
            <p className="text-gray-500">لم يتم نشر محتوى في هذا القسم بعد.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
            >
              {renderImageGrid(post.images, post.title)}

              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs font-bold bg-brand-light/10 text-brand-dark dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {hasFullAdminPrivileges && (
                    <button
                      onClick={() => deleteArtPost(post.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                  {post.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl text-sm">
                  {post.date && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">
                        {new Date(post.date).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  )}
                  {post.organizer && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{post.organizer}</span>
                    </div>
                  )}
                  {post.participantCount && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">
                        {post.participantCount} مشارك
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactions */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 relative">
                  <div
                    className="relative group/likes"
                    onMouseEnter={() =>
                      setExpandedLikes((prev) => ({ ...prev, [post.id]: true }))
                    }
                    onMouseLeave={() =>
                      setExpandedLikes((prev) => ({
                        ...prev,
                        [post.id]: false,
                      }))
                    }
                  >
                    <button
                      onClick={() => handleLike(post.id, post.likes || [])}
                      className={`flex items-center gap-2 transition-colors ${
                        currentUser &&
                        (post.likes || []).includes(currentUser.id)
                          ? "text-red-500"
                          : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 ${currentUser && (post.likes || []).includes(currentUser.id) ? "fill-current" : ""}`}
                      />
                      <span className="font-bold">
                        {(post.likes || []).length}
                      </span>
                    </button>
                    {/* Likes Tooltip */}
                    {expandedLikes[post.id] &&
                      (post.likes || []).length > 0 && (
                        <div className="absolute bottom-full right-0 mb-2 z-20 w-48 bg-gray-900 border border-gray-700 text-white rounded-xl shadow-lg p-3 text-xs animate-fade-in pointer-events-none">
                          <div className="font-bold mb-2 pb-1 border-b border-gray-700">
                            المعجبون:
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pointer-events-auto">
                            {(post.likes || []).map((likerId) => {
                              const liker = getUserById(likerId);
                              return (
                                <div
                                  key={likerId}
                                  className="flex items-center gap-2"
                                >
                                  <div className="w-5 h-5 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {liker?.profilePictureUrl ? (
                                      <img
                                        src={liker.profilePictureUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[9px] uppercase">
                                        {liker?.fullName.charAt(0) || "م"}
                                      </span>
                                    )}
                                  </div>
                                  <span className="truncate">
                                    {liker?.fullName || "مستخدم غير معروف"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedComments((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }))
                    }
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-dark dark:hover:text-brand-light transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-bold">
                      {post.comments?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments[post.id] && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-fade-in">
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                      {post.comments?.map((comment) => {
                        const authorUser = getUserById(comment.userId);
                        const isAuthor = currentUser?.id === comment.userId;
                        const isEditing = editingCommentId === comment.id;

                        return (
                          <div
                            key={comment.id}
                            className="bg-gray-50 dark:bg-gray-700 py-3 px-4 rounded-2xl text-sm relative group"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 mt-1">
                                {authorUser?.profilePictureUrl ? (
                                  <img
                                    src={authorUser.profilePictureUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 dark:text-white flex justify-between items-center mb-1">
                                  <span className="truncate">
                                    {authorUser?.fullName || "مستخدم مجهول"}
                                  </span>
                                  <div className="flex gap-1 bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-600 rounded px-1 transition-colors">
                                    {isAuthor && (
                                      <button
                                        title="تعديل التعليق"
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditedCommentText(comment.content);
                                        }}
                                        className="text-blue-500 hover:text-blue-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {(hasFullAdminPrivileges || isAuthor) && (
                                      <button
                                        title="حذف التعليق"
                                        onClick={() =>
                                          deleteArtComment(
                                            post.id,
                                            comment.id,
                                            post.comments,
                                          )
                                        }
                                        className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="flex gap-2 mt-2">
                                    <input
                                      type="text"
                                      value={editedCommentText}
                                      onChange={(e) =>
                                        setEditedCommentText(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          editedCommentText.trim()
                                        ) {
                                          editArtComment(
                                            post.id,
                                            comment.id,
                                            editedCommentText.trim(),
                                            post.comments,
                                          );
                                          setEditingCommentId(null);
                                        } else if (e.key === "Escape") {
                                          setEditingCommentId(null);
                                        }
                                      }}
                                      autoFocus
                                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-light"
                                    />
                                    <button
                                      onClick={() => {
                                        if (editedCommentText.trim()) {
                                          editArtComment(
                                            post.id,
                                            comment.id,
                                            editedCommentText.trim(),
                                            post.comments,
                                          );
                                          setEditingCommentId(null);
                                        }
                                      }}
                                      className="text-brand-dark dark:text-brand-light font-bold text-xs px-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      onClick={() => setEditingCommentId(null)}
                                      className="text-gray-500 text-xs px-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!post.comments || post.comments.length === 0) && (
                        <p className="text-center text-sm text-gray-400 py-4">
                          لا توجد تعليقات بعد. كُن أول من يعلق!
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentTexts[post.id] || ""}
                        onChange={(e) =>
                          setCommentTexts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleComment(post.id, post.comments);
                        }}
                        placeholder="اكتب تعليقاً..."
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light dark:text-white"
                      />
                      <button
                        onClick={() => handleComment(post.id, post.comments)}
                        className="bg-brand-dark dark:bg-brand-light text-white dark:text-brand-dark px-6 rounded-full font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        disabled={!commentTexts[post.id]?.trim()}
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in py-10"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-full overflow-y-auto no-scrollbar rounded-3xl shadow-2xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                منشور جديد
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  عنوان المنشور
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    القسم
                  </label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light"
                    value={newPost.category}
                    onChange={(e) =>
                      setNewPost({
                        ...newPost,
                        category: e.target.value as any,
                      })
                    }
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    تاريخ التنفيذ
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light"
                    value={
                      newPost.date
                        ? new Date(newPost.date).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setNewPost({ ...newPost, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  النص / الوصف
                </label>
                <textarea
                  rows={5}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light resize-none"
                  value={newPost.description}
                  onChange={(e) =>
                    setNewPost({ ...newPost, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    الجهة المنظمة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شعبة الفنون والمسرح"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light"
                    value={newPost.organizer}
                    onChange={(e) =>
                      setNewPost({ ...newPost, organizer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    عدد المشاركين (اختياري)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light"
                    value={newPost.participantCount || ""}
                    onChange={(e) =>
                      setNewPost({
                        ...newPost,
                        participantCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  إضافة صور
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    اسحب الصور هنا أو اضغط للاختيار
                  </p>
                </div>
                {newPost.images && newPost.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto p-2 mt-4">
                    {newPost.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setNewPost((prev) => ({
                              ...prev,
                              images: prev.images?.filter(
                                (_, index) => index !== i,
                              ),
                            }))
                          }
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreatePost}
                disabled={!newPost.title || !newPost.description}
                className="w-full bg-brand-dark dark:bg-brand-light text-white dark:text-brand-dark py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                نشر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      {viewerContext && (
        <div
          className="fixed inset-0 z-[100] flex animate-fade-in bg-black/95 backdrop-blur-xl"
          onClick={closeImageViewer}
        >
          <div className="absolute top-4 right-4 flex gap-4 z-50">
            <div className="bg-black/50 px-4 py-2 rounded-full text-white font-bold backdrop-blur-md">
              {viewerContext.currentIndex + 1} / {viewerContext.images.length}
            </div>
            <button
              className="bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                closeImageViewer();
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {viewerContext.images.length > 1 && (
            <>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white hover:bg-white hover:text-black transition-all hover:scale-110 z-50 backdrop-blur-md"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white hover:bg-white hover:text-black transition-all hover:scale-110 z-50 backdrop-blur-md"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={viewerContext.images[viewerContext.currentIndex]}
              alt={viewerContext.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain select-none rounded-xl shadow-2xl"
              draggable={false}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-3 rounded-full text-white font-bold backdrop-blur-md z-50 max-w-[90%] truncate">
            {viewerContext.title}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtsPlatform;
