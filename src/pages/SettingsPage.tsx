import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOwnProfile, uploadProfilePicture } from "../services/userRepository";
import { useAppearance } from "../state/AppearanceContext";
import { useAuth } from "../state/AuthContext";

export function SettingsPage() {
  const { firebaseUser, profile, refreshProfile, signOut } = useAuth();
  const { mode, setMode } = useAppearance();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile) {
      setPhotoURL(URL.createObjectURL(nextFile));
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();

    if (!firebaseUser) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const finalPhotoURL = file ? await uploadProfilePicture(firebaseUser.uid, file) : photoURL;
      await updateOwnProfile(firebaseUser.uid, {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL
      });
      await refreshProfile();
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>Account Settings</h1>
      </header>
      <section className="panel">
        <p className="eyebrow">Profile</p>
        <form className="stack-form" onSubmit={saveProfile}>
          <div className="avatar-preview avatar-preview--small">
            {photoURL ? <img alt="Profile" src={photoURL} /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
          </div>
          <label>
            Display Name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
          <label>
            Profile Picture
            <input accept="image/*" type="file" onChange={handleFile} />
          </label>
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {message ? <p className="muted">{message}</p> : null}
        </form>
      </section>
      <section className="panel">
        <p className="eyebrow">Appearance</p>
        <h2>Theme</h2>
        <div className="segmented-control">
          <button className={mode === "light" ? "is-active" : ""} type="button" onClick={() => setMode("light")}>
            Light Mode
          </button>
          <button className={mode === "dark" ? "is-active" : ""} type="button" onClick={() => setMode("dark")}>
            Dark Mode
          </button>
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">Account</p>
        <button className="secondary-button" type="button" onClick={handleSignOut}>
          Sign Out
        </button>
      </section>
    </div>
  );
}
