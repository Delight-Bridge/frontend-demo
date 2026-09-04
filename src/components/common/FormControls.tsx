import { useState } from "react";
import { ImageUp } from "lucide-react";
import { uploadImage } from "../../api/client";

export const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-gray-700">
      <span>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function ImageField({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 업로드하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label="이미지" required={required}>
      <input
        className={inputClass}
        type="text"
        inputMode="url"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://... 또는 아래에서 파일 선택"
      />
      <label className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 text-xs text-gray-600 hover:border-brand-500 hover:text-brand-700">
        <ImageUp size={16} />
        {uploading ? "업로드 중..." : "JPG, PNG, WEBP 파일 선택 (최대 5MB)"}
        <input
          type="file"
          className="sr-only"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </Field>
  );
}

export function FormError({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
