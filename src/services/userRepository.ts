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
import { requireFirebaseServices } from "./firebase";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
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
  const { db } = requireFirebaseServices();

  await updateDoc(doc(db, "users", uid), {
    displayName: values.displayName,
    photoURL: values.photoURL,
    updatedAt: serverTimestamp()
  });
}

export async function uploadProfilePicture(uid: string, file: File): Promise<string> {
  const { storage } = requireFirebaseServices();
  const storagePath = `profile-pictures/${uid}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type
  });

  return getDownloadURL(storageRef);
}

export async function listUsers(): Promise<UserProfile[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("displayName")));
  return snapshot.docs.map((document) => fromUserDocument(document.id, document.data()));
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
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
