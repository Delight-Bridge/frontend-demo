import { useState } from "react";
import { api } from "../../api/client";
import type { NewsArticle } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, ImageField, inputClass } from "../common/FormControls";

export function NewsForm({
  article,
  onClose,
  onSaved,
}: {
  article?: NewsArticle;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: article?.title ?? "",
    sourceUrl: article?.sourceUrl ?? "",
    sourceName: article?.sourceName ?? "",
    thumbnailUrl: article?.thumbnailUrl ?? "",
    summary: article?.summary ?? "",
    publishedAt: article?.publishedAt ?? new Date().toISOString().slice(0, 10),
    displayOrder: article?.displayOrder ?? 100,
    isVisible: article?.isVisible ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(article ? `/news/${article.id}` : "/news", {
        method: article ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title={article ? "소식 수정" : "소식 등록"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <Field label="제목" required>
          <input
            required
            maxLength={200}
            className={inputClass}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="원문 링크" required>
          <input
            required
            type="url"
            className={inputClass}
            value={form.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
          />
        </Field>
        <Field label="출처명">
          <input
            maxLength={100}
            className={inputClass}
            value={form.sourceName}
            onChange={(e) => set("sourceName", e.target.value)}
          />
        </Field>
        <ImageField required value={form.thumbnailUrl} onChange={(value) => set("thumbnailUrl", value)} />
        <Field label="요약" required>
          <textarea
            required
            maxLength={1000}
            rows={4}
            className={inputClass}
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="게시일" required>
            <input
              required
              type="date"
              className={inputClass}
              value={form.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
            />
          </Field>
          <Field label="정렬 순서">
            <input
              type="number"
              className={inputClass}
              value={form.displayOrder}
              onChange={(e) => set("displayOrder", Number(e.target.value))}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isVisible} onChange={(e) => set("isVisible", e.target.checked)} />
          공개
        </label>
        <FormError message={error} />
        <button
          disabled={saving}
          className="h-11 w-full rounded-md bg-gray-900 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>
    </Dialog>
  );
}
