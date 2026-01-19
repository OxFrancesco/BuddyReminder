import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isLoaded && user) {
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      }).catch(console.error);
    }
  }, [isLoaded, user, upsertUser]);
}
