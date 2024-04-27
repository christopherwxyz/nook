import { NotificationsAllFeed } from "@nook/app/features/notifications/notifications-tabs";
import { getServerSession } from "@nook/app/server/auth";

export default async function Home() {
  const session = await getServerSession();
  if (!session) return null;

  return <NotificationsAllFeed fid={session.fid} />;
}
