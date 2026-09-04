import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import type { TestimonyComment } from "../../types/platform";
import { inputClass } from "../common/FormControls";

export function CommentItem({
  postId,
  comment,
  onChanged,
}: {
  postId: string;
  comment: TestimonyComment;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState("");
  const save = async () => {
    try {
      await api(`/testimonies/${postId}/comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
      setEditing(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "수정하지 못했습니다.");
    }
  };
  const remove = async () => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    try {
      await api(`/testimonies/${postId}/comments/${comment.id}`, { method: "DELETE" });
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  };
  return (
    <li className="border-t py-4 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{comment.author?.nickname}</p>
          <time className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleString("ko-KR")}
            {comment.updatedAt !== comment.createdAt && " · 수정됨"}
          </time>
        </div>
        {comment.canManage && (
          <div className="flex">
            <button
              onClick={() => setEditing(true)}
              className="grid h-8 w-8 place-items-center text-gray-500"
              aria-label="댓글 수정"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => void remove()}
              className="grid h-8 w-8 place-items-center text-red-500"
              aria-label="댓글 삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="mt-3">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setContent(comment.content);
              }}
              className="px-3 py-2 text-xs"
            >
              취소
            </button>
            <button onClick={() => void save()} className="rounded bg-gray-900 px-3 py-2 text-xs font-bold text-white">
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{comment.content}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}
