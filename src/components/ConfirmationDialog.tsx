'use client';

type ConfirmationDialogProps = {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmationDialog = ({
  title,
  description,
  cancelLabel,
  confirmLabel,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full rounded-t-xl bg-white shadow-xl sm:max-w-md sm:rounded-lg">
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-[#393536]">{title}</h2>

          <p className="mt-2 text-sm leading-5 text-[#6b6968]">{description}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e5e4e2] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 cursor-pointer rounded-md border border-[#cfcfcd] px-5 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-semibold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
