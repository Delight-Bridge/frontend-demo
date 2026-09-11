import { Navigate, Route, Routes } from "react-router-dom";
import { ActionSection } from "./components/action/ActionSection";
import { ParticipationPage } from "./components/action/ParticipationPage";
import { AdminPage } from "./components/admin/AdminPage";
import { Footer } from "./components/layout/Footer";
import { HeroSection } from "./components/layout/HeroSection";
import { SiteHeader } from "./components/layout/SiteHeader";
import { MinistrySection } from "./components/ministries/MinistrySection";
import { NewsSection } from "./components/news/NewsSection";
import { NewsDetailPage } from "./components/news/NewsDetailPage";
import { NewsListPage } from "./components/news/NewsListPage";
import { TestimonialSection } from "./components/testimonials/TestimonialSection";
import { TestimonyDetailPage } from "./components/testimonials/TestimonyDetailPage";
import { TestimonyListPage } from "./components/testimonials/TestimonyListPage";
import { TestimonyWritePage } from "./components/testimonials/TestimonyWritePage";
import { MyActivitiesPage } from "./components/mypage/MyActivitiesPage";
import { MyPage } from "./components/mypage/MyPage";
import { ProfilePage } from "./components/mypage/ProfilePage";
import { TeamApplicantsPage } from "./components/mypage/TeamApplicantsPage";
import { TeamActivitiesPage } from "./components/mypage/TeamActivitiesPage";
import { TeamContentPage } from "./components/mypage/TeamContentPage";

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <aside className="bg-darkness pt-24 text-center text-white" aria-label="Delight Bridge 메시지">
          <blockquote className="mx-auto max-w-2xl font-serif text-lg leading-snug">
            “작은 나눔 하나가
            <br className="sm:hidden" /> 누군가에게는 <span className="text-brand-400">생명줄</span>이 됩니다”
          </blockquote>
          <p className="mt-3 text-xs font-medium text-brand-400">— 디아코니아팀 활동 후기 중</p>
        </aside>
        <NewsSection />
        <MinistrySection />
        <ActionSection />
        <TestimonialSection />
      </main>
      <Footer />
    </>
  );
}

function SectionPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-brand-50">
        {children}
      </main>
      <Footer />
    </>
  );
}

function NotFoundPage() {
  return (
    <SectionPage>
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <p className="text-sm font-bold text-brand-800">404</p>
          <h1 className="mt-2 text-3xl font-bold">페이지를 찾을 수 없습니다</h1>
          <a href="/" className="mt-6 inline-flex rounded-md bg-darkness px-5 py-3 font-bold text-white">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    </SectionPage>
  );
}

export default function App() {
  return (
    <>
      <a
        href="#main-content"
        onClick={(event) => {
          const main = document.querySelector("main");
          if (main instanceof HTMLElement) {
            event.preventDefault();
            main.tabIndex = -1;
            main.focus();
          }
        }}
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-white px-4 py-2 font-bold text-gray-900 shadow focus:translate-y-0"
      >
        본문으로 건너뛰기
      </a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:articleId" element={<NewsDetailPage />} />
        <Route
          path="/activities"
          element={
            <SectionPage>
              <MinistrySection showBreadcrumb />
            </SectionPage>
          }
        />
        <Route path="/testimony" element={<TestimonyListPage />} />
        <Route path="/testimony/new" element={<TestimonyWritePage />} />
        <Route path="/testimony/:postId" element={<TestimonyDetailPage />} />
        <Route path="/volunteer" element={<ParticipationPage />} />
        <Route path="/participate" element={<Navigate to="/volunteer" replace />} />
        <Route path="/mypage" element={<MyPage />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="activities" element={<MyActivitiesPage />} />
          <Route path="team-content" element={<TeamContentPage />} />
          <Route path="team-activities" element={<TeamActivitiesPage />} />
          <Route path="applicants" element={<TeamApplicantsPage />} />
        </Route>
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/uploader" element={<Navigate to="/mypage/applicants" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
