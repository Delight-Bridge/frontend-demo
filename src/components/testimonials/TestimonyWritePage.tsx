import { ArrowLeft, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { TestimonyPost } from "../../types/platform";
import { Field, FormError, ImageField, inputClass } from "../common/FormControls";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

export function TestimonyWritePage() {
  const { user, loading, openLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", content: "", thumbnailUrl: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api<TestimonyPost>("/testimonies", {
        method: "POST",
        body: JSON.stringify({ ...form, visibility: "PUBLIC" }),
      });
      navigate(`/testimony/${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "간증을 등록하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-gray-500">회원 정보를 확인하는 중입니다.</main>
    );
  if (!user)
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[75vh] place-items-center bg-gray-50 p-5">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center">
            <LogIn className="mx-auto text-brand-700" size={34} />
            <h1 className="mt-5 text-2xl font-bold">로그인이 필요합니다</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">회복 간증은 로그인한 회원만 작성할 수 있습니다.</p>
            <button
              type="button"
              onClick={() => openLogin("/testimony/new")}
              className="mt-6 h-11 w-full rounded-md bg-gray-900 font-bold text-white"
            >
              로그인
            </button>
            <a href="/testimony" className="mt-3 inline-flex items-center gap-2 py-2 text-sm text-gray-500">
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </a>
          </div>
        </main>
        <Footer />
      </>
    );

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <PageBreadcrumb
            items={[{ label: "회복 간증", href: "/testimony" }, { label: "간증 작성" }]}
            className="mb-6"
          />
          <a
            href="/testimony"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-950"
          >
            <ArrowLeft size={17} />글 목록으로 돌아가기
          </a>
          <div className="mt-8 rounded-lg border bg-white">
            <div className="border-b px-5 py-5 md:px-7">
              <p className="text-xs font-bold tracking-[0.2em] text-brand-700">WRITE</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-950">회복 간증 작성</h1>
            </div>
            <form onSubmit={submit} className="space-y-5 p-5 md:p-7">
              <Field label="제목" required>
                <input
                  required
                  maxLength={200}
                  className={inputClass}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="제목을 입력하세요"
                />
              </Field>
              <Field label="본문" required>
                <textarea
                  required
                  maxLength={20000}
                  rows={14}
                  className={inputClass}
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  placeholder="나누고 싶은 회복의 이야기를 작성해 주세요"
                />
              </Field>
              <ImageField
                value={form.thumbnailUrl}
                onChange={(thumbnailUrl) => setForm((current) => ({ ...current, thumbnailUrl }))}
              />
              <FormError message={error} />
              <button
                disabled={saving}
                className="h-12 w-full rounded-md bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "등록 중..." : "등록"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
