import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

// Hook genérico para qualquer coleção do usuário
export function useCollection(collectionName) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, collectionName),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, collectionName]);

  const add = async (item) => {
    await addDoc(collection(db, collectionName), {
      ...item,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const update = async (id, item) => {
    await updateDoc(doc(db, collectionName, id), item);
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return { data, loading, add, update, remove };
}