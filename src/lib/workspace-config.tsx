import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  defaultSetup,
  profiles,
  type Profile,
  type ProfileId,
  type WorkspaceSetup,
} from "./whi-profile";

type Ctx = {
  profile: Profile;
  setProfile: (id: ProfileId) => void;
  setup: WorkspaceSetup;
  updateSetup: (patch: Partial<WorkspaceSetup>) => void;
};

const WorkspaceConfigContext = createContext<Ctx | null>(null);

const KEY = "whi.config.v1";

/** One shared workspace identity across every page of the product. */
export function WorkspaceConfigProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId>("programmer");
  const [setup, setSetup] = useState<WorkspaceSetup>(defaultSetup);

  // Read persisted config after hydration so SSR and first paint agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { profileId?: ProfileId; setup?: WorkspaceSetup };
      if (parsed.profileId && profiles[parsed.profileId]) setProfileId(parsed.profileId);
      if (parsed.setup) setSetup({ ...defaultSetup, ...parsed.setup });
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ profileId, setup }));
    } catch {
      /* ignore */
    }
  }, [profileId, setup]);

  const value = useMemo<Ctx>(
    () => ({
      profile: profiles[profileId],
      setProfile: setProfileId,
      setup,
      updateSetup: (patch) => setSetup((s) => ({ ...s, ...patch })),
    }),
    [profileId, setup],
  );

  return (
    <WorkspaceConfigContext.Provider value={value}>{children}</WorkspaceConfigContext.Provider>
  );
}

export function useWorkspaceConfig(): Ctx {
  const ctx = useContext(WorkspaceConfigContext);
  if (!ctx) throw new Error("useWorkspaceConfig must be used inside WorkspaceConfigProvider");
  return ctx;
}
