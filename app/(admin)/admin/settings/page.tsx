import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Platform configuration and preferences.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Info</CardTitle>
            <CardDescription>General settings for the RUYA platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Platform Name</span>
                <span className="font-medium">RUYA Sourcing Platform</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Database</span>
                <span className="font-medium">SQLite (dev)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Auth Provider</span>
                <span className="font-medium">NextAuth.js (Credentials)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
