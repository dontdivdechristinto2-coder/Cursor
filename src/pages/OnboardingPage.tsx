import { ChangeEvent, FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CloudLogo } from "../components/CloudLogo";
import { completeUserOnboarding, uploadProfilePicture } from "../services/userRepository";
import { useAuth } from "../state/AuthContext";

export function OnboardingPage() {
  const { firebaseUser, loading, onboardingRequired, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName ?? "");
  const [photoURL, setPhotoURL] = useState(firebaseUser?.photoURL ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState(firebaseUser?.photoURL ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <main className="center-screen">Preparing your profile...</main>;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingRequired && profile) {
    return <Navigate to="/" replace />;
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (file) {
      const nextPreview = URL.createObjectURL(file);
      setPreviewURL(nextPreview);
      setPhotoURL("");
    }
  };

  const handleNameSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!photoURL && !selectedFile) {
      setError("Choose your Google profile image or upload a profile picture.");
      return;
    }

    setSaving(true);

    try {
      const finalPhotoURL = selectedFile ? await uploadProfilePicture(firebaseUser.uid, selectedFile) : photoURL;
      await completeUserOnboarding({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: displayName.trim(),
        photoURL: finalPhotoURL
      });
      await refreshProfile();
      navigate("/", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to complete profile setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--wide">
        <CloudLogo compact />
        <p className="eyebrow">First login setup</p>
        <h1>Set up your CopticCloud profile</h1>
        <div className="step-indicator" aria-label={`Step ${step} of 2`}>
          <span className={step === 1 ? "is-active" : ""}>Display name</span>
          <span className={step === 2 ? "is-active" : ""}>Profile picture</span>
        </div>
        {step === 1 ? (
          <form className="stack-form" onSubmit={handleNameSubmit}>
            <label>
              Display Name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit">
              Continue
            </button>
          </form>
        ) : (
          <form className="stack-form" onSubmit={handleProfileSubmit}>
            <div className="avatar-preview">
              {previewURL ? <img alt="Selected profile" src={previewURL} /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
            </div>
            {firebaseUser.photoURL ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setPhotoURL(firebaseUser.photoURL ?? "");
                  setSelectedFile(null);
                  setPreviewURL(firebaseUser.photoURL ?? "");
                }}
              >
                Use Google profile picture
              </button>
            ) : null}
            <label>
              Upload Profile Picture
              <input accept="image/*" type="file" onChange={handleFileChange} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="form-row">
              <button className="secondary-button" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Saving..." : "Finish"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
