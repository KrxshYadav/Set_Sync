import { getMyProfile } from "@/lib/get-profile";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Your country and unit drive the leaderboard. Set your big 4 to get
          ranked.
        </p>
      </div>
      <SettingsForm profile={profile} />
    </div>
  );
}
