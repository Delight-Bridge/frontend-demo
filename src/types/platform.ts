export type Role = "ADMIN" | "AUTHORIZED_UPLOADER" | "USER";
export type SocialProvider = "google" | "kakao" | "naver";

export type User = {
  id: string;
  socialProvider: SocialProvider | "";
  email: string;
  nickname: string;
  name: string;
  phone: string;
  profileImageUrl: string;
  privacyAgreedAt: string;
  onboardingCompletedAt: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  user: User | null;
  needsOnboarding: boolean;
  oauthConfigured: Record<SocialProvider, boolean>;
  demoLoginEnabled: boolean;
};

export type PageResult<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export type NewsArticle = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceName: string;
  thumbnailUrl: string;
  summary: string;
  publishedAt: string;
  displayOrder: number;
  isVisible: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MinistryTeam = {
  id: string;
  name: string;
  shortDescription: string;
  vision: string;
  activities: string;
  schedule: string;
  targetAudience: string;
  contactInfo: string;
  kakaoInviteUrl: string;
  displayOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminMember = User & {
  team: Pick<MinistryTeam, "id" | "name"> | null;
};

export type GalleryComment = {
  id: string;
  galleryPostId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  canManage: boolean;
};

export type GalleryPost = {
  id: string;
  ministryTeamId: string;
  title: string;
  content: string;
  thumbnailUrl: string;
  additionalImages: string[];
  authorId: string;
  author: User;
  team: Pick<MinistryTeam, "id" | "name">;
  displayOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: GalleryComment[];
  canManage: boolean;
};

export type VolunteerActivity = {
  id: string;
  ministryTeamId: string;
  title: string;
  vision: string;
  description: string;
  schedule: string;
  capacity: string;
  availableDates: string[];
  nextAvailableDate: string;
  isAcceptingApplications: boolean;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  team: Pick<MinistryTeam, "id" | "name"> | null;
};

export type RecentActiveTeam = {
  team: Pick<MinistryTeam, "id" | "name" | "shortDescription">;
  latestActivity: Pick<GalleryPost, "id" | "title" | "thumbnailUrl" | "createdAt">;
};

export type HomeActivityPreview = {
  activities: VolunteerActivity[];
  recentTeams: RecentActiveTeam[];
};

export type TestimonyComment = {
  id: string;
  testimonyPostId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  canManage: boolean;
};

export type TestimonyPost = {
  id: string;
  ministryTeamId?: string;
  team?: Pick<MinistryTeam, "id" | "name"> | null;
  title: string;
  content: string;
  thumbnailUrl: string;
  authorId: string;
  author: User;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  canManage: boolean;
  comments?: TestimonyComment[];
};

export type ApplicationStatus =
  "SUBMITTED" | "ADMIN_CONFIRMED" | "HANDED_TO_LEADER" | "REJECTED" | "CANCELLED" | "COMPLETED";

export type VolunteerApplication = {
  id: string;
  userId: string;
  activityId: string;
  ministryTeamId: string;
  participationDate: string;
  applicantName: string;
  age: number;
  phone: string;
  contact: string;
  introduction: string;
  participationType: "ONCE" | "CONTINUOUS";
  status: ApplicationStatus;
  source: "SITE" | "MANUAL";
  memo: string;
  privacyAgreedAt: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  user: User | null;
  activity: (Pick<VolunteerActivity, "id" | "title"> & { availableDates?: string[] }) | null;
  team: Pick<MinistryTeam, "id" | "name"> | null;
  canCancel?: boolean;
  canEdit?: boolean;
  history?: ApplicationStatusHistory[];
};

export type ApplicationStatusHistory = {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | "";
  toStatus: ApplicationStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
};

export type TeamMembership = {
  id: string;
  userId: string;
  ministryTeamId: string;
  membershipRole: "MEMBER" | "LEADER";
  status: "ACTIVE" | "INACTIVE";
  joinedAt: string;
  leftAt: string;
  user: User;
};

export type AdminTeamOverview = {
  team: MinistryTeam;
  memberships: TeamMembership[];
  eligibleUsers: User[];
  posts: Array<Pick<GalleryPost, "id" | "title" | "thumbnailUrl" | "isVisible" | "createdAt">>;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalApplications: number;
  pendingApplications: number;
  visibleNews: number;
  totalNews: number;
};
