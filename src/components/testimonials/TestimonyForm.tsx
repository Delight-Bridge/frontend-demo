import { useState } from "react";
import { api } from "../../api/client";
import type { TestimonyPost } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, ImageField, inputClass } from "../common/FormControls";

export function TestimonyForm({
  post,
  onClose,
  onSaved,
}: {
  post?: TestimonyPost;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: post?.title ?? "",
    content: post?.content ?? "",
    thumbnailUrl: post?.thumbnailUrl ?? "",
    visibility: post?.visibility ?? "PUBLIC",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(post ? `/testimonies/${post.id}` : "/testimonies", {
        method: post ? "PATCH" : "POST",
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
    <Dialog title={post ? "회복 간증 수정" : "회복 간증 작성"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4 p-5 md:p-6">
        <Field label="제목" required>
          <input
            required
            maxLength={200}
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="본문" required>
          <textarea
            required
            maxLength={20000}
            rows={12}
            className={inputClass}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </Field>
        <ImageField value={form.thumbnailUrl} onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })} />
        <Field label="공개 상태" required>
          <select
            className={inputClass}
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value as "PUBLIC" | "PRIVATE" })}
          >
            <option value="PUBLIC">전체 공개</option>
            <option value="PRIVATE">비공개 (나와 관리자만 조회)</option>
          </select>
        </Field>
        <FormError message={error} />
        <button
          disabled={saving}
          className="h-12 w-full rounded-md bg-brand-600 font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "간증 저장"}
        </button>
      </form>
    </Dialog>
  );
}
