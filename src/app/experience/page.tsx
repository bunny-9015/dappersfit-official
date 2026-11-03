import InteractiveWatch from "@/components/InteractiveWatch";

export const metadata = {
  title: "3D Experience | DappersFit",
  description: "Interactive 3D luxury watch mechanics.",
};

export default function ExperiencePage() {
  return (
    <main className="w-full h-screen bg-gray-950 overflow-hidden">
      <InteractiveWatch />
    </main>
  );
}
