import { ImagePlus, Link, X } from "lucide-react";
import { useState } from "react";
import { api, uploadImage } from "../../api/client";
import type { GalleryPost, MinistryTeam } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

export function GalleryForm({
  post,
  teams,
  onClose,
  onSaved,
}: {
  post?: GalleryPost;
  teams: MinistryTeam[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ministryTeamId: post?.ministryTeamId ?? teams[0]?.id ?? "",
    title: post?.title ?? "",
    content: post?.content ?? "",
    displayOrder: post?.displayOrder ?? 100,
    isVisible: post?.isVisible ?? true,
  });
  const [images, setImages] = useState(() =>
    [post?.thumbnailUrl, ...(post?.additionalImages ?? [])].filter((item): item is string => Boolean(item)),
  );
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const invalid = selected.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      setError("JPG, PNG, WEBP 형식의 5MB 이하 이미지만 업로드할 수 있습니다.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(selected.map(uploadImage));
      setImages((current) => [...current, ...uploaded]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 업로드하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const value = imageUrl.trim();
    if (!value) return;
    try {
      new URL(value);
      setImages((current) => [...current, value]);
      setImageUrl("");
      setError("");
    } catch {
      setError("올바른 이미지 URL을 입력해 주세요.");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!images.length) {
      setError("이미지를 한 장 이상 업로드해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, thumbnailUrl: images[0], additionalImages: images.slice(1) };
      await api(post ? `/gallery/${post.id}` : "/gallery", {
        method: post ? "PATCH" : "POST",
        body: JSON.stringify(payload),
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
    <Dialog title={post ? "활동 게시물 수정" : "활동 게시물 등록"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4 p-5">
        <Field label="사역팀" required>
          <select
            required
            className={inputClass}
            value={form.ministryTeamId}
            onChange={(event) => set("ministryTeamId", event.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제목" required>
          <input
            required
            maxLength={200}
            className={inputClass}
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>
        <Field label="본문" required>
          <textarea
            required
            maxLength={10000}
            rows={5}
            className={inputClass}
            value={form.content}
            onChange={(event) => set("content", event.target.value)}
          />
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700">
            이미지 <span className="text-red-500">*</span>
          </legend>
          <p className="text-xs text-gray-500">한 장 이상 등록해 주세요. 첫 번째 이미지가 대표 이미지로 표시됩니다.</p>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-md border bg-gray-100"
                >
                  <img src={image} alt={`업로드 이미지 ${index + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-bold text-white">
                    {index === 0 ? "대표" : index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((_, targetIndex) => targetIndex !== index))}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-gray-700 shadow"
                    aria-label={`이미지 ${index + 1} 삭제`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 text-sm font-bold text-gray-600 hover:border-brand-500 hover:text-brand-700">
            <ImagePlus size={18} />
            {uploading ? "이미지 업로드 중..." : "이미지 선택 (여러 장 가능)"}
            <input
              type="file"
              multiple
              className="sr-only"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(event) => {
                void addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              className={inputClass}
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="또는 이미지 URL 입력"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-bold text-gray-700"
            >
              <Link size={16} />
              추가
            </button>
          </div>
        </fieldset>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(event) => set("isVisible", event.target.checked)}
            />
            공개
          </label>
          <Field label="정렬 순서">
            <input
              type="number"
              className={`${inputClass} w-24`}
              value={form.displayOrder}
              onChange={(event) => set("displayOrder", Number(event.target.value))}
            />
          </Field>
        </div>
        <FormError message={error} />
        <button
          disabled={saving || uploading}
          className="h-11 w-full rounded-md bg-gray-900 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>
    </Dialog>
  );
}
