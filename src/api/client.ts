import {
  demoActivities,
  demoApplications,
  demoGallery,
  demoNews,
  demoTeams,
  demoTestimonies,
  demoUsers,
} from "../data/demoData";
import type {
  GalleryComment,
  GalleryPost,
  MinistryTeam,
  PageResult,
  TestimonyPost,
  User,
  VolunteerApplication,
} from "../types/platform";

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
  withdrawnUsers: 0,
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
const sessionKey = "delight-demo-user";
const wait = () => new Promise((resolve) => window.setTimeout(resolve, 80));
const bodyOf = (options: RequestInit) => (typeof options.body === "string" ? JSON.parse(options.body) : {});
const currentUser = () =>
  db.users.find((user) => user.id === (sessionStorage.getItem(sessionKey) ?? localStorage.getItem(sessionKey))) ?? null;
const storeCurrentUser = (userId: string, remember = false) => {
  sessionStorage.removeItem(sessionKey);
  localStorage.removeItem(sessionKey);
  (remember ? localStorage : sessionStorage).setItem(sessionKey, userId);
};
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
const updateUser = (userId: string, values: Partial<User>) => {
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new ApiError(404, "회원을 찾을 수 없습니다.");
  const next = { ...user, ...values };
  const teamPosition = next.role === "AUTHORIZED_UPLOADER" ? (next.teamPosition ?? "LEADER") : null;
  if (teamPosition && !["LEADER", "DEPUTY_LEADER"].includes(teamPosition))
    throw new ApiError(400, "팀장 또는 부팀장을 선택해 주세요.");
  if (!["ADMIN", "AUTHORIZED_UPLOADER", "USER"].includes(next.role))
    throw new ApiError(400, "올바른 회원 역할을 선택해 주세요.");
  if (next.ministryTeamId && !db.teams.some((team) => team.id === next.ministryTeamId))
    throw new ApiError(404, "사역팀을 찾을 수 없습니다.");
  if (next.role === "AUTHORIZED_UPLOADER" && next.ministryTeamId) {
    const leaders = db.users.filter(
      (item) =>
        item.id !== userId &&
        item.ministryTeamId === next.ministryTeamId &&
        item.role === "AUTHORIZED_UPLOADER" &&
        (item.teamPosition ?? "LEADER") === teamPosition,
    );
    if (leaders.length >= 1)
      throw new ApiError(
        409,
        `사역팀의 ${teamPosition === "DEPUTY_LEADER" ? "부팀장" : "팀장"}은 1명만 지정할 수 있습니다. 기존 담당자를 해제한 후 다시 지정해 주세요.`,
      );
  }
  return update(db.users, userId, { ...values, teamPosition });
};
const teamValues = (body: Record<string, unknown>, creating = false): Partial<MinistryTeam> => {
  const values: Partial<MinistryTeam> = {};
  const required = ["name", "shortDescription", "vision", "activities", "schedule"] as const;
  const fields = [...required, "targetAudience", "contactInfo", "kakaoInviteUrl"] as const;
  for (const field of fields) {
    if (!(field in body) && !creating) continue;
    const value = body[field] ?? "";
    if (typeof value !== "string") throw new ApiError(400, "사역팀 정보를 올바르게 입력해 주세요.");
    if (required.some((key) => key === field) && !value.trim())
      throw new ApiError(400, "사역팀명, 한 줄 소개, 비전, 주요 활동, 활동 일정을 입력해 주세요.");
    values[field] = value.trim();
  }
  if ("displayOrder" in body) {
    if (typeof body.displayOrder !== "number" || !Number.isSafeInteger(body.displayOrder) || body.displayOrder < 1)
      throw new ApiError(400, "노출 순서는 1 이상의 정수로 입력해 주세요.");
    values.displayOrder = body.displayOrder;
  }
  if ("isVisible" in body) {
    if (typeof body.isVisible !== "boolean") throw new ApiError(400, "공개 여부를 올바르게 선택해 주세요.");
    values.isVisible = body.isVisible;
  }
  return values;
};
const teamFor = (teamId: string) => {
  const team = db.teams.find((item) => item.id === teamId);
  return team ? { id: team.id, name: team.name } : null;
};
const activityFor = (activityId: string) => {
  const activity = db.activities.find((item) => item.id === activityId);
  return activity ? { id: activity.id, title: activity.title, availableDates: activity.availableDates } : null;
};
const requireGalleryTeam = (user: User, teamId: string) => {
  if (
    user.role !== "ADMIN" &&
    !(user.role === "AUTHORIZED_UPLOADER" && user.ministryTeamId && user.ministryTeamId === teamId)
  )
    throw new ApiError(403, "팀장은 소속 사역팀의 게시물만 작성·수정·삭제할 수 있습니다.");
  const team = teamFor(teamId);
  if (!team) throw new ApiError(400, "게시물을 작성할 사역팀을 선택해 주세요.");
  return team;
};
const galleryForViewer = (post: GalleryPost) => {
  const mutable = post as GalleryPost & { likedUserIds?: string[] };
  return {
    ...post,
    team: teamFor(post.ministryTeamId) ?? post.team,
    likedByMe: Boolean(mutable.likedUserIds?.includes(currentUser()?.id ?? "")),
    canManage:
      currentUser()?.role === "ADMIN" ||
      (currentUser()?.role === "AUTHORIZED_UPLOADER" && post.ministryTeamId === currentUser()?.ministryTeamId),
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
    storeCurrentUser(map[body.account as keyof typeof map] ?? map.user);
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
    storeCurrentUser(user.id, body.rememberMe === true);
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
    storeCurrentUser(user.id);
    return { user } as T;
  }
  if (route === "/auth/logout" && method === "POST") {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(sessionKey);
    return undefined as T;
  }
  if (route === "/me") {
    const user = requireUser();
    if (method === "DELETE") {
      if (user.role === "ADMIN") throw new ApiError(403, "관리자 계정은 회원 탈퇴할 수 없습니다.");
      remove(db.users, user.id);
      db.withdrawnUsers += 1;
      delete emailPasswords[user.id];
      sessionStorage.removeItem(sessionKey);
      localStorage.removeItem(sessionKey);
      return undefined as T;
    }
    if (method === "PATCH") {
      const { privacyConsent } = body;
      const values: Partial<User> = {};
      for (const key of ["name", "phone", "nickname", "profileImageUrl"] as const) {
        if (typeof body[key] === "string") values[key] = body[key];
      }
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
      team: user.ministryTeamId ? (db.teams.find((item) => item.id === user.ministryTeamId) ?? null) : null,
      requestedTeam: user.requestedMinistryTeamId
        ? (db.teams.find((item) => item.id === user.requestedMinistryTeamId) ?? null)
        : null,
    } as T;
  }

  if (route === "/me/team-change-request" && method === "POST") {
    const user = requireUser();
    if (user.role !== "USER") throw new ApiError(403, "일반 회원만 소속 사역팀 변경을 신청할 수 있습니다.");
    const teamId = String(body.ministryTeamId ?? "");
    if (!db.teams.some((item) => item.id === teamId && item.isVisible))
      throw new ApiError(404, "변경할 사역팀을 찾을 수 없습니다.");
    if (teamId === user.ministryTeamId) throw new ApiError(400, "현재 소속된 사역팀입니다.");
    return updateUser(user.id, {
      requestedMinistryTeamId: teamId,
      teamChangeRequestedAt: new Date().toISOString(),
    }) as T;
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
    return db.teams
      .filter((item) => item.isVisible || url.searchParams.get("includeHidden") === "true")
      .sort((a, b) => a.displayOrder - b.displayOrder) as T;
  if (route === "/teams" && method === "POST") {
    requireAdmin();
    const values = teamValues(body, true);
    const timestamp = new Date().toISOString();
    const team: MinistryTeam = {
      name: "",
      shortDescription: "",
      vision: "",
      activities: "",
      schedule: "",
      targetAudience: "",
      contactInfo: "",
      kakaoInviteUrl: "",
      displayOrder: Math.max(0, ...db.teams.map((item) => item.displayOrder)) + 1,
      isVisible: true,
      ...values,
      id: newId("team"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.teams.push(team);
    return team as T;
  }
  if (/^\/teams\/[^/]+$/.test(route) && method === "DELETE") {
    requireAdmin();
    const teamId = route.split("/")[2];
    if (!db.teams.some((item) => item.id === teamId)) throw new ApiError(404, "사역팀을 찾을 수 없습니다.");
    const hasRelatedData =
      db.users.some((item) => item.ministryTeamId === teamId || item.requestedMinistryTeamId === teamId) ||
      [db.activities, db.applications, db.gallery, db.testimonies].some((items) =>
        items.some((item) => item.ministryTeamId === teamId),
      );
    if (hasRelatedData)
      throw new ApiError(
        409,
        "소속 회원, 가입 신청 또는 활동·게시물 이력이 있는 사역팀은 삭제할 수 없습니다. 사역팀 수정에서 비공개로 설정할 수 있습니다.",
      );
    remove(db.teams, teamId);
    return undefined as T;
  }
  if (route.startsWith("/teams/") && method === "PATCH") {
    const user = requireUser();
    const teamId = route.split("/")[2];
    if (user.role !== "ADMIN" && !(user.role === "AUTHORIZED_UPLOADER" && teamId === user.ministryTeamId))
      throw new ApiError(403, "담당 팀 정보만 수정할 수 있습니다.");
    const team = update(db.teams, teamId, teamValues(body));
    for (const items of [db.activities, db.applications, db.gallery, db.testimonies]) {
      for (const item of items) {
        if (item.ministryTeamId === teamId) item.team = { id: team.id, name: team.name };
      }
    }
    return team as T;
  }
  if (route === "/activities/home-preview")
    return {
      activities: db.activities.filter((item) => item.isVisible && item.isAcceptingApplications),
      recentTeams: [],
    } as T;
  if (route === "/activities" && method === "GET") {
    const teamId = url.searchParams.get("teamId");
    const viewer = currentUser();
    const includeHidden =
      url.searchParams.get("includeHidden") === "true" &&
      (viewer?.role === "ADMIN" || (viewer?.role === "AUTHORIZED_UPLOADER" && teamId === viewer.ministryTeamId));
    return db.activities.filter(
      (item) => (!teamId || item.ministryTeamId === teamId) && (item.isVisible || includeHidden),
    ) as T;
  }
  if (route === "/activities" && method === "POST") {
    const user = requireUser();
    if (user.role !== "ADMIN" && !(user.role === "AUTHORIZED_UPLOADER" && body.ministryTeamId === user.ministryTeamId))
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
    if (
      user.role !== "ADMIN" &&
      !(user.role === "AUTHORIZED_UPLOADER" && activity.ministryTeamId === user.ministryTeamId)
    )
      throw new ApiError(403, "담당 팀의 봉사활동만 관리할 수 있습니다.");
    if (method === "PATCH") {
      if (user.role === "AUTHORIZED_UPLOADER" && body.ministryTeamId !== user.ministryTeamId)
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
          (item.isVisible ||
            (url.searchParams.get("includeHidden") === "true" &&
              (currentUser()?.role === "ADMIN" ||
                (currentUser()?.role === "AUTHORIZED_UPLOADER" &&
                  currentUser()?.ministryTeamId === item.ministryTeamId)))),
      )
      .map(galleryForViewer) as T;
  }
  if (route === "/gallery" && method === "POST") {
    const user = requireUser();
    const team = requireGalleryTeam(user, body.ministryTeamId);
    const item = {
      ...body,
      id: newId("gallery"),
      authorId: user.id,
      author: user,
      team,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      comments: [],
      canManage: true,
    };
    db.gallery.unshift(item);
    return galleryForViewer(item) as T;
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
    const user = requireUser();
    const itemId = route.split("/")[2];
    const post = db.gallery.find((item) => item.id === itemId);
    if (!post) throw new ApiError(404, "현장 게시물을 찾을 수 없습니다.");
    requireGalleryTeam(user, post.ministryTeamId);
    if (method === "PATCH") {
      const teamId = body.ministryTeamId ?? post.ministryTeamId;
      const team = requireGalleryTeam(user, teamId);
      const values: Partial<GalleryPost> = {};
      for (const key of [
        "title",
        "content",
        "thumbnailUrl",
        "additionalImages",
        "displayOrder",
        "isVisible",
      ] as const) {
        if (Object.prototype.hasOwnProperty.call(body, key)) Object.assign(values, { [key]: body[key] });
      }
      const item = update(db.gallery, itemId, { ...values, ministryTeamId: teamId, team });
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
    const monthFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
    });
    const currentMonth = monthFormatter.format(new Date());
    return {
      cumulativeUsers: db.users.length + db.withdrawnUsers,
      activeUsers: db.users.filter((item) => item.status === "ACTIVE").length,
      suspendedUsers: db.users.filter((item) => item.status === "SUSPENDED").length,
      withdrawnUsers: db.withdrawnUsers,
      totalApplications: db.applications.length,
      monthlyApplications: db.applications.filter(
        (item) => monthFormatter.format(new Date(item.appliedAt)) === currentMonth,
      ).length,
      completedApplications: db.applications.filter((item) => item.status === "COMPLETED").length,
      currentMonth,
      visibleNews: db.news.filter((item) => item.isVisible).length,
      totalNews: db.news.length,
    } as T;
  }
  if (route === "/admin/users" && method === "GET") {
    requireAdmin();
    let items = db.users.map((item) => ({
      ...item,
      team: item.ministryTeamId ? teamFor(item.ministryTeamId) : null,
      requestedTeam: item.requestedMinistryTeamId ? teamFor(item.requestedMinistryTeamId) : null,
    }));
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
  const teamChangeRequestMatch = route.match(/^\/admin\/users\/([^/]+)\/team-change-request$/);
  if (teamChangeRequestMatch && method === "PATCH") {
    requireAdmin();
    const user = db.users.find((item) => item.id === teamChangeRequestMatch[1]);
    if (!user) throw new ApiError(404, "회원을 찾을 수 없습니다.");
    if (!user.requestedMinistryTeamId) throw new ApiError(400, "처리할 팀 변경 요청이 없습니다.");
    const approve = body.action === "APPROVE";
    return updateUser(user.id, {
      ministryTeamId: approve ? user.requestedMinistryTeamId : user.ministryTeamId,
      requestedMinistryTeamId: null,
      teamChangeRequestedAt: "",
    }) as T;
  }
  if (/^\/admin\/users\/[^/]+$/.test(route) && method === "PATCH") {
    requireAdmin();
    const values: Partial<User> = {};
    for (const key of ["role", "status", "ministryTeamId", "teamPosition"] as const) {
      if (Object.prototype.hasOwnProperty.call(body, key)) Object.assign(values, { [key]: body[key] });
    }
    if (Object.prototype.hasOwnProperty.call(values, "ministryTeamId")) {
      values.requestedMinistryTeamId = null;
      values.teamChangeRequestedAt = "";
    }
    return updateUser(route.split("/")[3], values) as T;
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
    if (!team) throw new ApiError(404, "사역팀을 찾을 수 없습니다.");
    return {
      team,
      memberships: db.users
        .filter((item) => item.ministryTeamId === team?.id)
        .map((user) => ({
          id: `membership-${user.id}`,
          userId: user.id,
          ministryTeamId: team?.id ?? "",
          membershipRole: user.role === "AUTHORIZED_UPLOADER" ? (user.teamPosition ?? "LEADER") : "MEMBER",
          status: "ACTIVE",
          joinedAt: user.updatedAt,
          leftAt: "",
          user,
        })),
      eligibleUsers: db.users.filter((item) => item.role !== "ADMIN" && item.ministryTeamId !== team?.id),
      posts: db.gallery.filter((item) => item.ministryTeamId === team?.id),
    } as T;
  }
  const teamMemberMatch = route.match(/^\/admin\/teams\/([^/]+)\/members(?:\/([^/]+))?$/);
  if (teamMemberMatch) {
    requireAdmin();
    const teamId = teamMemberMatch[1];
    const userId = teamMemberMatch[2] ?? body.userId;
    const user = db.users.find((item) => item.id === userId);
    if (!db.teams.some((item) => item.id === teamId)) throw new ApiError(404, "사역팀을 찾을 수 없습니다.");
    if (!user) throw new ApiError(404, "회원을 찾을 수 없습니다.");
    if (method === "PATCH") {
      if (user.ministryTeamId !== teamId || user.role === "ADMIN")
        throw new ApiError(400, "이 팀에 소속된 일반 회원이나 팀장만 지정할 수 있습니다.");
      if (!["LEADER", "DEPUTY_LEADER", "MEMBER"].includes(body.membershipRole))
        throw new ApiError(400, "팀장, 부팀장 또는 일반 팀원을 선택해 주세요.");
      return updateUser(user.id, {
        role: body.membershipRole === "MEMBER" ? "USER" : "AUTHORIZED_UPLOADER",
        teamPosition: body.membershipRole === "MEMBER" ? null : body.membershipRole,
      }) as T;
    }
    if (method === "POST") {
      if (user.role === "ADMIN") throw new ApiError(400, "관리자는 팀원으로 추가할 수 없습니다.");
      return updateUser(user.id, {
        ministryTeamId: teamId,
        requestedMinistryTeamId: null,
        teamChangeRequestedAt: "",
      }) as T;
    }
    if (method === "DELETE" && user.ministryTeamId === teamId)
      return updateUser(user.id, {
        ministryTeamId: null,
        requestedMinistryTeamId: null,
        teamChangeRequestedAt: "",
      }) as T;
    return undefined as T;
  }
  const uploaderApplicationMatch = route.match(/^\/uploader\/applications\/([^/]+)$/);
  if (uploaderApplicationMatch && method === "PATCH") {
    const user = requireUser();
    if (user.role !== "AUTHORIZED_UPLOADER") throw new ApiError(403, "팀장 데모 계정이 필요합니다.");
    const application = db.applications.find((item) => item.id === uploaderApplicationMatch[1]);
    if (!application || application.ministryTeamId !== user.ministryTeamId)
      throw new ApiError(404, "담당 팀의 신청 내역을 찾을 수 없습니다.");
    const nextStatus = body.status as VolunteerApplication["status"];
    const allowed =
      (application.status === "SUBMITTED" && nextStatus === "LEADER_CONFIRMED") ||
      (application.status === "LEADER_CONFIRMED" && nextStatus === "COMPLETED");
    if (!allowed) throw new ApiError(400, "변경할 수 없는 신청 상태입니다.");
    return update(db.applications, application.id, {
      status: nextStatus,
      canCancel: false,
      canEdit: false,
      history: [
        ...(application.history ?? []),
        {
          id: newId("history"),
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: nextStatus,
          changedBy: user.id,
          changedByName: user.name || user.nickname,
          changedAt: new Date().toISOString(),
        },
      ],
    }) as T;
  }
  if (route === "/uploader/applications") {
    const user = requireUser();
    if (!["ADMIN", "AUTHORIZED_UPLOADER"].includes(user.role)) throw new ApiError(403, "팀장 데모 계정이 필요합니다.");
    const items = db.applications.filter(
      (item) =>
        ["SUBMITTED", "LEADER_CONFIRMED", "COMPLETED"].includes(item.status) &&
        (user.role === "ADMIN" || item.ministryTeamId === user.ministryTeamId),
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
