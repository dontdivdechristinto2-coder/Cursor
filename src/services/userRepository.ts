import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { UserProfile, UserRole } from "../domain/user";
import { isFirebaseConfigured, requireFirebaseServices } from "./firebase";

const LOCAL_PROFILE_KEY = "copticcloud-local-profile";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) {
    const profile = readLocalProfile();
    return profile?.uid === uid ? profile : null;
  }

  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return fromUserDocument(snapshot.id, snapshot.data());
}

export async function completeUserOnboarding(params: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}): Promise<void> {
  if (!isFirebaseConfigured) {
    writeLocalProfile({
      uid: params.uid,
      email: params.email,
      displayName: params.displayName,
      photoURL: params.photoURL,
      role: "Admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return;
  }

  const { db } = requireFirebaseServices();

  await setDoc(doc(db, "users", params.uid), {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    photoURL: params.photoURL,
    role: "User",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateOwnProfile(uid: string, values: Pick<UserProfile, "displayName" | "photoURL">): Promise<void> {
  if (!isFirebaseConfigured) {
    const profile = readLocalProfile();
    if (!profile || profile.uid !== uid) {
      return;
    }

    writeLocalProfile({
      ...profile,
      ...values,
      updatedAt: new Date()
    });
    return;
  }

  const { db } = requireFirebaseServices();

  await updateDoc(doc(db, "users", uid), {
    displayName: values.displayName,
    photoURL: values.photoURL,
    updatedAt: serverTimestamp()
  });
}

export async function uploadProfilePicture(uid: string, file: File): Promise<string> {
  if (!isFirebaseConfigured) {
    return readFileAsDataURL(file);
  }

  const { storage } = requireFirebaseServices();
  const storagePath = `profile-pictures/${uid}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type
  });

  return getDownloadURL(storageRef);
}

export async function listUsers(): Promise<UserProfile[]> {
  if (!isFirebaseConfigured) {
    const profile = readLocalProfile();
    return profile ? [profile] : [];
  }

  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("displayName")));
  return snapshot.docs.map((document) => fromUserDocument(document.id, document.data()));
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  if (!isFirebaseConfigured) {
    const profile = readLocalProfile();
    if (profile?.uid === uid) {
      writeLocalProfile({
        ...profile,
        role,
        updatedAt: new Date()
      });
    }
    return;
  }

  const { db } = requireFirebaseServices();

  await updateDoc(doc(db, "users", uid), {
    role,
    updatedAt: serverTimestamp()
  });
}

function fromUserDocument(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: String(data.uid ?? id),
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    photoURL: String(data.photoURL ?? ""),
    role: data.role === "Admin" ? "Admin" : "User",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt)
  };
}

function toDate(value: unknown): Date | undefined {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  return undefined;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

function readLocalProfile(): UserProfile | null {
  const stored = localStorage.getItem(LOCAL_PROFILE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    return null;
  }
}

function writeLocalProfile(profile: UserProfile): void {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
