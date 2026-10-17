import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Hero({ items, show, active, ...props }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <Image className="rounded-full" src={avatar} width={32} alt="Avatar" />
        <h1 className="mb-6 text-5xl font-bold md:text-6xl" data-aos-delay={150}>
          The website builder you're <br className="max-lg:hidden" />
          looking for
        </h1>
        <a className={cn("btn", active && "bg-blue-500")} href="#0">
          Start{" "}
          <span className={`ml-1 ${active ? "text-blue-300" : ""}`}>-&gt;</span>
        </a>
        <button {...props} className="w-60 rounded-lg">
          Learn More
        </button>
        <>
          <ul className="[&_span]:opacity-0">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {show && <motion.div className="mt-4" hidden />}
        </>
      </div>
    </section>
  );
}

const Badge = () => <span className="text-xs">New</span>;
