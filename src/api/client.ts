import {
  demoActivities,
  demoApplications,
  demoGallery,
  demoNews,
  demoTeams,
  demoTestimonies,
  demoUsers,
} from "../data/demoData";
import type { GalleryComment, GalleryPost, PageResult, TestimonyPost, VolunteerApplication } from "../types/platform";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const db = {
  users: structuredClone(demoUsers),
  teams: structuredClone(demoTeams),
  activities: structuredClone(demoActivities),
  applications: structuredClone(demoApplications),
  news: structuredClone(demoNews),
  gallery: structuredClone(demoGallery),
  testimonies: structuredClone(demoTestimonies),
};
const emailPasswords: Record<string, string> = {
  "demo-admin": "demo1234",
  "demo-uploader": "demo1234",
  "demo-user": "demo1234",
  "demo-member-2": "demo1234",
};
const wait = () => new Promise((resolve) => window.setTimeout(resolve, 80));
const bodyOf = (options: RequestInit) => (typeof options.body === "string" ? JSON.parse(options.body) : {});
const currentUser = () => db.users.find((user) => user.id === sessionStorage.getItem("delight-demo-user")) ?? null;
const needsOnboarding = () => {
  const user = currentUser();
  return Boolean(user && (!user.name || !user.phone || !user.privacyAgreedAt || !user.onboardingCompletedAt));
};
const requireUser = () => {
  const user = currentUser();
  if (!user) throw new ApiError(401, "데모 로그인이 필요합니다.");
  return user;
};
const requireAdmin = () => {
  const user = requireUser();
  if (user.role !== "ADMIN") throw new ApiError(403, "관리자 데모 계정이 필요합니다.");
  return user;
};
const parseUrl = (path: string) => new URL(path, "https://demo.local");
const paginate = <T>(items: T[], url: URL): PageResult<T> | T[] => {
  if (!url.searchParams.has("page") && !url.searchParams.has("pageSize")) return items;
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || 20);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(totalPages, Math.max(1, Number(url.searchParams.get("page")) || 1));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems, totalPages };
};
const remove = <T extends { id: string }>(items: T[], itemId: string) => {
  const index = items.findIndex((item) => item.id === itemId);
  if (index >= 0) items.splice(index, 1);
};
const update = <T extends { id: string }>(items: T[], itemId: string, values: Partial<T>) => {
  const item = items.find((entry) => entry.id === itemId);
  if (!item) throw new ApiError(404, "샘플 항목을 찾을 수 없습니다.");
  Object.assign(item, values, { updatedAt: new Date().toISOString() });
  return item;
};
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const teamFor = (teamId: string) => {
  const team = db.teams.find((item) => item.id === teamId);
  return team ? { id: team.id, name: team.name } : null;
};
const activityFor = (activityId: string) => {
  const activity = db.activities.find((item) => item.id === activityId);
  return activity ? { id: activity.id, title: activity.title, availableDates: activity.availableDates } : null;
};
const galleryForViewer = (post: GalleryPost) => {
  const mutable = post as GalleryPost & { likedUserIds?: string[] };
  return {
    ...post,
    likedByMe: Boolean(mutable.likedUserIds?.includes(currentUser()?.id ?? "")),
    canManage:
      currentUser()?.role === "ADMIN" ||
      (currentUser()?.role === "AUTHORIZED_UPLOADER" && post.ministryTeamId === "team-1"),
    comments: post.comments.map((comment) => ({
      ...comment,
      canManage: Boolean(currentUser() && (currentUser()?.role === "ADMIN" || currentUser()?.id === comment.authorId)),
    })),
  };
};
const testimonyForViewer = (post: TestimonyPost) => ({
  ...post,
  likedByMe: Boolean(
    (post as TestimonyPost & { likedUserIds?: string[] }).likedUserIds?.includes(currentUser()?.id ?? ""),
  ),
  canManage: Boolean(currentUser() && (currentUser()?.role === "ADMIN" || currentUser()?.id === post.authorId)),
  comments: post.comments?.map((comment) => ({
    ...comment,
    canManage: Boolean(currentUser() && (currentUser()?.role === "ADMIN" || currentUser()?.id === comment.authorId)),
  })),
});

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  await wait();
  const url = parseUrl(path);
  const route = url.pathname;
  const method = (options.method ?? "GET").toUpperCase();
  const body = bodyOf(options);
  if (route === "/auth/session")
    return {
      user: currentUser(),
      needsOnboarding: needsOnboarding(),
      oauthConfigured: { google: false, kakao: false, naver: false },
      demoLoginEnabled: true,
    } as T;
  if (route === "/auth/demo" && method === "POST") {
    const map = { admin: "demo-admin", uploader: "demo-uploader", user: "demo-user", new: "demo-new-user" } as const;
    sessionStorage.setItem("delight-demo-user", map[body.account as keyof typeof map] ?? map.user);
    return { user: currentUser() } as T;
  }
  if (route === "/auth/email/login" && method === "POST") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user || emailPasswords[user.id] !== body.password)
      throw new ApiError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
    if (user.status !== "ACTIVE") throw new ApiError(403, "이용이 정지된 계정입니다.");
    sessionStorage.setItem("delight-demo-user", user.id);
    return { user } as T;
  }
  if (route === "/auth/register" && method === "POST") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email || !body.password || !body.name?.trim() || !body.phone?.trim() || body.privacyConsent !== true)
      throw new ApiError(400, "이메일, 비밀번호, 이름, 연락처와 개인정보 동의는 필수입니다.");
    if (String(body.password).length < 8) throw new ApiError(400, "비밀번호는 8자 이상 입력해 주세요.");
    if (db.users.some((item) => item.id !== "demo-new-user" && item.email.toLowerCase() === email))
      throw new ApiError(409, "이미 가입된 이메일입니다.");
    const user = db.users.find((item) => item.id === "demo-new-user");
    if (!user) throw new ApiError(404, "신규 회원 데모 계정을 찾을 수 없습니다.");
    const registeredAt = new Date().toISOString();
    Object.assign(user, {
      name: body.name.trim(),
      nickname: body.name.trim(),
      phone: body.phone.trim(),
      email,
      socialProvider: "",
      privacyAgreedAt: registeredAt,
      onboardingCompletedAt: registeredAt,
      updatedAt: registeredAt,
    });
    emailPasswords[user.id] = body.password;
    sessionStorage.setItem("delight-demo-user", user.id);
    return { user } as T;
  }
  if (route === "/auth/logout" && method === "POST") {
    sessionStorage.removeItem("delight-demo-user");
    return undefined as T;
  }
  if (route === "/me") {
    const user = requireUser();
    if (method === "PATCH") {
      const { privacyConsent, ...values } = body;
      if (needsOnboarding() && (!values.name?.trim() || !values.phone?.trim() || privacyConsent !== true))
        throw new ApiError(400, "이름, 전화번호와 개인정보 동의는 필수입니다.");
      Object.assign(user, values, { updatedAt: new Date().toISOString() });
      if (privacyConsent === true)
        Object.assign(user, {
          privacyAgreedAt: new Date().toISOString(),
          onboardingCompletedAt: new Date().toISOString(),
        });
    }
    return {
      user,
      needsOnboarding: needsOnboarding(),
      team: user.role === "AUTHORIZED_UPLOADER" ? (db.teams.find((item) => item.id === "team-1") ?? null) : null,
    } as T;
  }

  if (route === "/news" && method === "GET")
    return db.news.filter(
      (item) => item.isVisible || (url.searchParams.get("includeHidden") === "true" && currentUser()?.role === "ADMIN"),
    ) as T;
  if (route === "/news" && method === "POST") {
    const user = requireAdmin();
    const item = {
      ...body,
      id: newId("news"),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.news.unshift(item);
    return item as T;
  }
  if (route.startsWith("/news/")) {
    const itemId = route.split("/")[2];
    const item = db.news.find((entry) => entry.id === itemId);
    if (method === "GET") {
      if (!item || (!item.isVisible && currentUser()?.role !== "ADMIN"))
        throw new ApiError(404, "기사를 찾을 수 없습니다.");
      return item as T;
    }
    requireAdmin();
    if (method === "PATCH") return update(db.news, itemId, body) as T;
    if (method === "DELETE") {
      remove(db.news, itemId);
      return undefined as T;
    }
  }

  if (route === "/teams" && method === "GET")
    return db.teams.filter((item) => item.isVisible || url.searchParams.get("includeHidden") === "true") as T;
  if (route.startsWith("/teams/") && method === "PATCH") {
    const user = requireUser();
    const teamId = route.split("/")[2];
    if (user.role !== "ADMIN" && !(user.role === "AUTHORIZED_UPLOADER" && teamId === "team-1"))
      throw new ApiError(403, "담당 팀 정보만 수정할 수 있습니다.");
    return update(db.teams, teamId, body) as T;
  }
  if (route === "/activities/home-preview")
    return {
      activities: db.activities.filter((item) => item.isVisible && item.isAcceptingApplications).slice(0, 3),
      recentTeams: [],
    } as T;
  if (route === "/activities" && method === "GET") {
    const teamId = url.searchParams.get("teamId");
    const viewer = currentUser();
    const includeHidden =
      url.searchParams.get("includeHidden") === "true" &&
      (viewer?.role === "ADMIN" || (viewer?.role === "AUTHORIZED_UPLOADER" && teamId === "team-1"));
    return db.activities.filter(
      (item) => (!teamId || item.ministryTeamId === teamId) && (item.isVisible || includeHidden),
    ) as T;
  }
  if (route === "/activities" && method === "POST") {
    const user = requireUser();
    if (user.role !== "ADMIN" && !(user.role === "AUTHORIZED_UPLOADER" && body.ministryTeamId === "team-1"))
      throw new ApiError(403, "담당 팀의 봉사활동만 등록할 수 있습니다.");
    const dates = body.availableDates ?? [];
    const item = {
      ...body,
      id: newId("activity"),
      nextAvailableDate: dates[0] ?? "",
      team: teamFor(body.ministryTeamId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.activities.push(item);
    return item as T;
  }
  if (route.startsWith("/activities/")) {
    const user = requireUser();
    const itemId = route.split("/")[2];
    const activity = db.activities.find((item) => item.id === itemId);
    if (!activity) throw new ApiError(404, "봉사활동을 찾을 수 없습니다.");
    if (user.role !== "ADMIN" && !(user.role === "AUTHORIZED_UPLOADER" && activity.ministryTeamId === "team-1"))
      throw new ApiError(403, "담당 팀의 봉사활동만 관리할 수 있습니다.");
    if (method === "PATCH") {
      if (user.role === "AUTHORIZED_UPLOADER" && body.ministryTeamId !== "team-1")
        throw new ApiError(403, "봉사활동을 다른 팀으로 변경할 수 없습니다.");
      const item = update(db.activities, itemId, body);
      item.team = teamFor(item.ministryTeamId);
      item.nextAvailableDate = item.availableDates[0] ?? "";
      return item as T;
    }
    if (method === "DELETE") {
      remove(db.activities, itemId);
      return undefined as T;
    }
  }

  if (route === "/gallery" && method === "GET") {
    const teamId = url.searchParams.get("teamId");
    return db.gallery
      .filter(
        (item) =>
          (!teamId || item.ministryTeamId === teamId) &&
          (item.isVisible || url.searchParams.get("includeHidden") === "true"),
      )
      .map(galleryForViewer) as T;
  }
  if (route === "/gallery" && method === "POST") {
    const user = requireUser();
    const item = {
      ...body,
      id: newId("gallery"),
      authorId: user.id,
      author: user,
      team: teamFor(body.ministryTeamId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      comments: [],
      canManage: true,
    };
    db.gallery.unshift(item);
    return item as T;
  }
  const galleryLikeMatch = route.match(/^\/gallery\/([^/]+)\/like$/);
  if (galleryLikeMatch && method === "POST") {
    const user = requireUser();
    const post = db.gallery.find((item) => item.id === galleryLikeMatch[1]);
    if (!post) throw new ApiError(404, "현장 게시물을 찾을 수 없습니다.");
    const mutable = post as GalleryPost & { likedUserIds?: string[] };
    mutable.likedUserIds ??= [];
    const index = mutable.likedUserIds.indexOf(user.id);
    if (index >= 0) {
      mutable.likedUserIds.splice(index, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      mutable.likedUserIds.push(user.id);
      post.likeCount += 1;
    }
    return { liked: index < 0, likeCount: post.likeCount } as T;
  }
  const galleryCommentMatch = route.match(/^\/gallery\/([^/]+)\/comments(?:\/([^/]+))?$/);
  if (galleryCommentMatch) {
    const user = requireUser();
    const post = db.gallery.find((item) => item.id === galleryCommentMatch[1]);
    if (!post) throw new ApiError(404, "현장 게시물을 찾을 수 없습니다.");
    const commentId = galleryCommentMatch[2];
    if (!commentId && method === "POST") {
      const comment: GalleryComment = {
        id: newId("gallery-comment"),
        galleryPostId: post.id,
        authorId: user.id,
        author: user,
        content: body.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canManage: true,
      };
      post.comments.push(comment);
      post.commentCount = post.comments.length;
      return comment as T;
    }
    if (commentId && method === "DELETE") {
      const comment = post.comments.find((item) => item.id === commentId);
      if (!comment || (user.role !== "ADMIN" && comment.authorId !== user.id))
        throw new ApiError(403, "댓글을 삭제할 권한이 없습니다.");
      remove(post.comments, commentId);
      post.commentCount = post.comments.length;
      return undefined as T;
    }
  }
  if (route.startsWith("/gallery/")) {
    requireUser();
    const itemId = route.split("/")[2];
    if (method === "PATCH") {
      const item = update(db.gallery, itemId, body);
      item.team = teamFor(item.ministryTeamId) ?? item.team;
      return galleryForViewer(item) as T;
    }
    if (method === "DELETE") {
      remove(db.gallery, itemId);
      return undefined as T;
    }
  }

  if (route === "/testimonies" && method === "GET")
    return db.testimonies
      .filter((item) => item.visibility === "PUBLIC" || item.authorId === currentUser()?.id)
      .map(testimonyForViewer) as T;
  if (route === "/testimonies" && method === "POST") {
    const user = requireUser();
    const item: TestimonyPost = {
      ...body,
      id: newId("testimony"),
      authorId: user.id,
      author: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      canManage: true,
      comments: [],
    };
    db.testimonies.unshift(item);
    return item as T;
  }
  const likeMatch = route.match(/^\/testimonies\/([^/]+)\/like$/);
  if (likeMatch && method === "POST") {
    const user = requireUser();
    const post = db.testimonies.find((item) => item.id === likeMatch[1]);
    if (!post) throw new ApiError(404, "샘플 간증을 찾을 수 없습니다.");
    const mutable = post as TestimonyPost & { likedUserIds?: string[] };
    mutable.likedUserIds ??= [];
    const index = mutable.likedUserIds.indexOf(user.id);
    if (index >= 0) mutable.likedUserIds.splice(index, 1);
    else mutable.likedUserIds.push(user.id);
    post.likeCount = mutable.likedUserIds.length + 8;
    return { liked: index < 0, likeCount: post.likeCount } as T;
  }
  const commentMatch = route.match(/^\/testimonies\/([^/]+)\/comments(?:\/([^/]+))?$/);
  if (commentMatch) {
    const user = requireUser();
    const post = db.testimonies.find((item) => item.id === commentMatch[1]);
    if (!post) throw new ApiError(404, "샘플 간증을 찾을 수 없습니다.");
    post.comments ??= [];
    const commentId = commentMatch[2];
    if (!commentId && method === "POST") {
      const comment = {
        id: newId("comment"),
        testimonyPostId: post.id,
        authorId: user.id,
        author: user,
        content: body.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canManage: true,
      };
      post.comments.push(comment);
      post.commentCount = post.comments.length;
      return comment as T;
    }
    if (commentId && method === "PATCH") return update(post.comments, commentId, body) as T;
    if (commentId && method === "DELETE") {
      remove(post.comments, commentId);
      post.commentCount = post.comments.length;
      return undefined as T;
    }
  }
  const testimonyMatch = route.match(/^\/testimonies\/([^/]+)$/);
  if (testimonyMatch) {
    const itemId = testimonyMatch[1];
    const post = db.testimonies.find((item) => item.id === itemId);
    if (!post) throw new ApiError(404, "샘플 간증을 찾을 수 없습니다.");
    if (method === "GET") return testimonyForViewer(post) as T;
    requireUser();
    if (method === "PATCH") return testimonyForViewer(update(db.testimonies, itemId, body)) as T;
    if (method === "DELETE") {
      remove(db.testimonies, itemId);
      return undefined as T;
    }
  }

  if (route === "/applications/mine") return db.applications.filter((item) => item.userId === currentUser()?.id) as T;
  if (route === "/applications" && method === "POST") {
    const user = requireUser();
    const activity = db.activities.find((item) => item.id === body.activityId);
    if (!activity) throw new ApiError(404, "샘플 봉사활동을 찾을 수 없습니다.");
    const item: VolunteerApplication = {
      ...body,
      id: newId("application"),
      userId: user.id,
      ministryTeamId: activity.ministryTeamId,
      status: "SUBMITTED",
      source: "SITE",
      memo: "",
      contact: body.phone,
      privacyAgreedAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
      activity: activityFor(activity.id),
      team: teamFor(activity.ministryTeamId),
      canCancel: true,
      canEdit: true,
      history: [],
    };
    db.applications.unshift(item);
    return item as T;
  }
  const ownApplicationMatch = route.match(/^\/applications\/([^/]+)$/);
  if (ownApplicationMatch) {
    requireUser();
    const itemId = ownApplicationMatch[1];
    if (method === "PATCH") return update(db.applications, itemId, body) as T;
    if (method === "DELETE")
      return update(db.applications, itemId, { status: "CANCELLED", canCancel: false, canEdit: false }) as T;
  }

  if (route === "/admin/stats") {
    requireAdmin();
    return {
      totalUsers: db.users.length,
      activeUsers: db.users.filter((item) => item.status === "ACTIVE").length,
      totalApplications: db.applications.length,
      pendingApplications: db.applications.filter((item) => ["SUBMITTED", "ADMIN_CONFIRMED"].includes(item.status))
        .length,
      visibleNews: db.news.filter((item) => item.isVisible).length,
      totalNews: db.news.length,
    } as T;
  }
  if (route === "/admin/users" && method === "GET") {
    requireAdmin();
    let items = db.users.map((item) => {
      const assignedApplication = db.applications.find(
        (application) =>
          application.userId === item.id && ["HANDED_TO_LEADER", "COMPLETED"].includes(application.status),
      );
      const teamId = item.role === "AUTHORIZED_UPLOADER" ? "team-1" : assignedApplication?.ministryTeamId;
      return { ...item, team: teamId ? teamFor(teamId) : null };
    });
    const q = url.searchParams.get("q")?.toLowerCase();
    if (q)
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.nickname.toLowerCase().includes(q) ||
          item.phone.includes(q) ||
          item.socialProvider.includes(q) ||
          item.team?.name.toLowerCase().includes(q),
      );
    if (url.searchParams.get("role")) items = items.filter((item) => item.role === url.searchParams.get("role"));
    if (url.searchParams.get("status")) items = items.filter((item) => item.status === url.searchParams.get("status"));
    return paginate(items, url) as T;
  }
  if (route.startsWith("/admin/users/") && method === "PATCH") {
    requireAdmin();
    return update(db.users, route.split("/")[3], body) as T;
  }
  if (route === "/admin/applications" && method === "GET") {
    requireAdmin();
    let items = [...db.applications];
    const q = url.searchParams.get("q")?.toLowerCase();
    if (q) items = items.filter((item) => item.applicantName.toLowerCase().includes(q) || item.phone.includes(q));
    if (url.searchParams.get("status")) items = items.filter((item) => item.status === url.searchParams.get("status"));
    if (url.searchParams.get("teamId"))
      items = items.filter((item) => item.ministryTeamId === url.searchParams.get("teamId"));
    return paginate(items, url) as T;
  }
  if (route === "/admin/applications" && method === "POST") {
    requireAdmin();
    const item = {
      ...body,
      id: newId("application"),
      contact: body.phone,
      privacyAgreedAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: db.users.find((user) => user.id === body.userId) ?? null,
      team: teamFor(body.ministryTeamId),
      activity: activityFor(body.activityId),
      history: [],
    };
    db.applications.unshift(item);
    return item as T;
  }
  if (route.startsWith("/admin/applications/")) {
    const admin = requireAdmin();
    const itemId = route.split("/")[3];
    if (method === "PATCH") {
      const application = db.applications.find((item) => item.id === itemId);
      if (!application) throw new ApiError(404, "신청 내역을 찾을 수 없습니다.");
      const values = { ...body };
      if (body.status && body.status !== application.status) {
        values.history = [
          ...(application.history ?? []),
          {
            id: newId("history"),
            applicationId: itemId,
            fromStatus: application.status,
            toStatus: body.status,
            changedBy: admin.id,
            changedByName: admin.name || admin.nickname,
            changedAt: new Date().toISOString(),
          },
        ];
        values.canCancel = body.status === "SUBMITTED";
        values.canEdit = body.status === "SUBMITTED";
      }
      if (body.phone) values.contact = body.phone;
      if (body.ministryTeamId) values.team = teamFor(body.ministryTeamId);
      if (body.userId !== undefined) values.user = db.users.find((user) => user.id === body.userId) ?? null;
      return update(db.applications, itemId, values) as T;
    }
    if (method === "DELETE") {
      remove(db.applications, itemId);
      return undefined as T;
    }
  }
  const overviewMatch = route.match(/^\/admin\/teams\/([^/]+)\/overview$/);
  if (overviewMatch) {
    requireAdmin();
    const team = db.teams.find((item) => item.id === overviewMatch[1]);
    return {
      team,
      memberships:
        team?.id === "team-1"
          ? [
              {
                id: "membership-1",
                userId: "demo-uploader",
                ministryTeamId: "team-1",
                membershipRole: "LEADER",
                status: "ACTIVE",
                joinedAt: new Date().toISOString(),
                leftAt: "",
                user: db.users[1],
              },
            ]
          : [],
      eligibleUsers: db.users.filter((item) => item.role === "USER"),
      posts: db.gallery.filter((item) => item.ministryTeamId === team?.id),
    } as T;
  }
  if (/^\/admin\/teams\/[^/]+\/members/.test(route)) {
    requireAdmin();
    return undefined as T;
  }
  if (route === "/uploader/applications") {
    const user = requireUser();
    if (!["ADMIN", "AUTHORIZED_UPLOADER"].includes(user.role)) throw new ApiError(403, "팀장 데모 계정이 필요합니다.");
    const items = db.applications.filter(
      (item) =>
        ["HANDED_TO_LEADER", "COMPLETED"].includes(item.status) &&
        (user.role === "ADMIN" || item.ministryTeamId === "team-1"),
    );
    return paginate(items, url) as T;
  }
  throw new ApiError(404, `프론트 데모에서 지원하지 않는 요청입니다: ${method} ${route}`);
}

export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError(400, "샘플 이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
