import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { logger } from '@/lib/logger';

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
      }).catch((error) => logger.error('Failed to sync user:', error));
    }
  }, [isLoaded, user, upsertUser]);
}
