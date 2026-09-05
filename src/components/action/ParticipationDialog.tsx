import type { VolunteerActivity, VolunteerApplication } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { ParticipationForm } from "./ParticipationForm";

type ParticipationDialogProps = {
  activity: VolunteerActivity;
  applications: VolunteerApplication[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  loginReturnUrl?: string;
};

export function ParticipationDialog({
  activity,
  applications,
  onClose,
  onSaved,
  loginReturnUrl,
}: ParticipationDialogProps) {
  return (
    <Dialog title={activity.title} onClose={onClose} size="lg">
      <div
        className="soft-scrollbar max-h-[calc(90vh-69px)] overflow-y-auto overscroll-contain"
        data-testid="participation-dialog-scroll"
      >
        <div className="border-b bg-gray-50 p-5 md:p-6">
          <p className="text-xs font-bold text-brand-700">{activity.team?.name}</p>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-bold">비전</dt>
              <dd className="mt-1 leading-6 text-gray-600">{activity.vision}</dd>
            </div>
            <div>
              <dt className="font-bold">사역 내용</dt>
              <dd className="mt-1 leading-6 text-gray-600">{activity.description}</dd>
            </div>
            <div>
              <dt className="font-bold">일정</dt>
              <dd className="mt-1 text-gray-600">{activity.schedule}</dd>
            </div>
            <div>
              <dt className="font-bold">모집 인원</dt>
              <dd className="mt-1 text-gray-600">{activity.capacity}</dd>
            </div>
          </dl>
        </div>
        <ParticipationForm
          activity={activity}
          applications={applications}
          onSaved={onSaved}
          loginReturnUrl={loginReturnUrl}
        />
      </div>
    </Dialog>
  );
}
