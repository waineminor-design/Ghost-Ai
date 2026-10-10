import { Suspense } from "react";
import { Ghost, Network, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    text: "Describe a system and let AI map it onto the canvas",
  },
  {
    icon: Users,
    text: "Refine the architecture with collaborators in real time",
  },
  {
    icon: Network,
    text: "Turn the graph into a Markdown technical spec",
  },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="hidden flex-col justify-center gap-8 border-r border-border bg-sidebar px-16 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Ghost className="size-5" />
          <span className="font-heading text-lg font-semibold">Ghost AI</span>
        </div>
        <p className="max-w-sm font-heading text-2xl font-medium">
          Design the system before you write the code.
        </p>
        <ul className="flex flex-col gap-4">
          {features.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <Icon className="size-4 shrink-0" />
              {text}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex items-center justify-center p-4">
        {/* Clerk's form reads the URL at runtime, so it streams in after the shell. */}
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
