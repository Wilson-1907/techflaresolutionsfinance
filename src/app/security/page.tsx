import { ChangePanelPasswordForm } from "@/components/ChangePanelPasswordForm";

export default function SecurityPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Security</h1>
      <p className="text-muted text-sm mb-8">
        Finance panel passwords are stored as secure hashes in the database. Change your login password here
        for ongoing security.
      </p>
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <ChangePanelPasswordForm />
      </div>
    </>
  );
}
